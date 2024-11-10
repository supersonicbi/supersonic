import {
    type ApiChartAndResults,
    type ApiError,
    type ApiQueryResults,
    type DashboardFilters,
    type DateGranularity,
    type MetricQuery,
    type SortField,
} from '@lightdash/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { lightdashApi } from '../api';
import { useDashboardContext } from '../providers/DashboardProvider';
import {
    convertDateDashboardFilters,
    convertDateFilters,
} from '../utils/dateFilter';
import useToaster from './toaster/useToaster';
import useQueryError from './useQueryError';

type QueryResultsProps = {
    projectUuid: string;
    tableId: string;
    query?: MetricQuery;
    csvLimit?: number | null; //giving null returns all results (no limit)
    chartUuid?: string;
    dateZoomGranularity?: DateGranularity;
};

const getChartResults = async ({
    chartUuid,
    invalidateCache,
}: {
    chartUuid?: string;
    invalidateCache?: boolean;
    dashboardSorts?: SortField[];
}) => {
    return lightdashApi<ApiQueryResults>({
        url: `/saved/${chartUuid}/results`,
        method: 'POST',
        body: JSON.stringify({
            ...(invalidateCache && { invalidateCache: true }),
        }),
    });
};

const getChartAndResults = async ({
    chartUuid,
    dashboardUuid,
    dashboardFilters,
    invalidateCache,
    dashboardSorts,
    granularity,
    autoRefresh,
}: {
    chartUuid?: string;
    dashboardUuid: string;
    dashboardFilters: DashboardFilters;
    invalidateCache?: boolean;
    dashboardSorts: SortField[];
    granularity?: DateGranularity;
    autoRefresh?: boolean;
}) => {
    return lightdashApi<ApiChartAndResults>({
        url: `/saved/${chartUuid}/chart-and-results`,
        method: 'POST',
        body: JSON.stringify({
            dashboardUuid,
            dashboardFilters,
            dashboardSorts,
            granularity,
            ...(invalidateCache && { invalidateCache: true }),
            autoRefresh,
        }),
    });
};
const getQueryResults = async ({
    projectUuid,
    tableId,
    query,
    csvLimit,
    dateZoomGranularity,
}: QueryResultsProps) => {
    const timezoneFixQuery = query && {
        ...query,
        filters: convertDateFilters(query.filters),
        timezone: query.timezone ?? undefined,
    };

    return lightdashApi<ApiQueryResults>({
        url: `/projects/${projectUuid}/explores/${tableId}/runQuery`,
        method: 'POST',
        body: JSON.stringify({
            ...timezoneFixQuery,
            granularity: dateZoomGranularity,
            csvLimit,
        }),
    });
};

const getQueryDataSetResults = async ({
    projectUuid,
    tableId,
    query,
    csvLimit,
    dateZoomGranularity,
}: QueryResultsProps) => {
    const timezoneFixQuery: any = query && {
        ...query,
        filters: convertDateFilters(query.filters),
        timezone: query.timezone ?? undefined,
    };

    const {
        dimensions,
        metrics,
        additionalMetrics,
        sorts,
        timezone,
        exploreName,
        tableCalculations,
        limit,
    } = timezoneFixQuery;

    const dimensionColumns = (dimensions || []).map((item: string) =>
        item.slice(item.indexOf('_') + 1),
    );
    const metricColumns = (metrics || []).map((item: string) =>
        item.slice(item.indexOf('_') + 1),
    );

    const res = await lightdashApi<any>({
        url: '/supersonic/api/semantic/query/dataSet',
        method: 'POST',
        body: JSON.stringify({
            dataSetId: tableId,
            aggregators: metricColumns.map((item: string) => ({
                column: item,
            })),
            // dimensionFilters: [
            //     { bizName: 'work_id', value: '7314', operator: '=' },
            // ],
            dateInfo: {
                dateMode: 'BETWEEN',
                startDate: '2020-01-01',
                endDate: '2024-11-03',
                period: 'DAY',
            },
            groups: dimensionColumns,
            nativeQuery: false,
            limit,
        }),
    });

    const { columns, resultList } = res || {};

    return {
        cacheMetadata: { cacheHit: false },
        fields: (columns || []).reduce(
            (result: any, item: any, index: number) => {
                result[`${tableId}_${item.nameEn}`] = {
                    label: item.name,
                    name: item.nameEn,
                    fieldType:
                        item.showType === 'CATEGORY' ? 'dimension' : 'metric',
                    type: item.showType === 'CATEGORY' ? 'string' : 'number',
                    table: tableId,
                    tablesReferences: [tableId],
                    tablesRequiredAttributes: {
                        [tableId]: { can_access_orders: 'true' },
                    },
                    index,
                    hidden: false,
                };
                return result;
            },
            {},
        ),
        metricQuery: {
            ...timezoneFixQuery,
            granularity: dateZoomGranularity,
            csvLimit,
        },
        rows: resultList.map((item: any) =>
            Object.keys(item).reduce((result: any, key: any) => {
                result[`${tableId}_${key}`] = {
                    value: {
                        formatted: item?.[key],
                        raw: item?.[key],
                    },
                };
                return result;
            }, {}),
        ),
    };
};

export const useQueryResults = (props?: {
    chartUuid?: string;
    isViewOnly?: boolean;
    dateZoomGranularity?: DateGranularity;
}) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const setErrorResponse = useQueryError({
        forceToastOnForbidden: true,
        forbiddenToastTitle: 'Error running query',
    });

    // const fetchQuery =
    //     props?.isViewOnly === true ? getChartResults : getQueryResults;
    const fetchQuery =
        props?.isViewOnly === true ? getChartResults : getQueryDataSetResults;
    const mutation = useMutation<ApiQueryResults, ApiError, QueryResultsProps>(
        fetchQuery,
        {
            mutationKey: ['queryResults'],
            onError: (error) => {
                setErrorResponse(error);
            },
        },
    );

    const { mutateAsync } = mutation;

    const mutateAsyncOverride = useCallback(
        async (tableName: string, metricQuery: MetricQuery) => {
            const fields = new Set([
                ...metricQuery.dimensions,
                ...metricQuery.metrics,
                ...metricQuery.tableCalculations.map(({ name }) => name),
            ]);
            const isValidQuery = fields.size > 0;
            if (!!tableName && isValidQuery) {
                await mutateAsync({
                    projectUuid,
                    tableId: tableName,
                    query: metricQuery,
                    chartUuid: props?.chartUuid,
                    dateZoomGranularity: props?.dateZoomGranularity,
                });
            } else {
                console.warn(
                    `Can't make SQL request, invalid state`,
                    tableName,
                    isValidQuery,
                    metricQuery,
                );
                return Promise.reject();
            }
        },
        [
            mutateAsync,
            projectUuid,
            props?.chartUuid,
            props?.dateZoomGranularity,
        ],
    );

    return useMemo(
        () => ({ ...mutation, mutateAsync: mutateAsyncOverride }),
        [mutation, mutateAsyncOverride],
    );
};

const getUnderlyingDataResults = async ({
    projectUuid,
    tableId,
    query,
}: {
    projectUuid: string;
    tableId: string;
    query: MetricQuery;
}) => {
    const timezoneFixQuery = {
        ...query,
        filters: convertDateFilters(query.filters),
    };

    return lightdashApi<ApiQueryResults>({
        url: `/projects/${projectUuid}/explores/${tableId}/runUnderlyingDataQuery`,
        method: 'POST',
        body: JSON.stringify(timezoneFixQuery),
    });
};

export const useUnderlyingDataResults = (
    tableId: string,
    query: MetricQuery,
) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const queryKey = [
        'underlyingDataResults',
        projectUuid,
        JSON.stringify(query),
    ];
    return useQuery<ApiQueryResults, ApiError>({
        queryKey,
        queryFn: () =>
            getUnderlyingDataResults({
                projectUuid,
                tableId,
                query,
            }),
        retry: false,
    });
};

export const useChartAndResults = (
    chartUuid: string | null,
    dashboardUuid: string | null,
    dashboardFilters: DashboardFilters,
    dashboardSorts: SortField[],
    invalidateCache?: boolean,
    granularity?: DateGranularity,
    autoRefresh?: boolean,
) => {
    const setChartsWithDateZoomApplied = useDashboardContext(
        (c) => c.setChartsWithDateZoomApplied,
    );
    const queryClient = useQueryClient();

    const sortKey =
        dashboardSorts
            ?.map((ds) => `${ds.fieldId}.${ds.descending}`)
            ?.join(',') || '';
    const queryKey = useMemo(
        () => [
            'savedChartResults',
            chartUuid,
            dashboardUuid,
            dashboardFilters,
            invalidateCache,
            sortKey,
            autoRefresh,
        ],
        [
            chartUuid,
            dashboardUuid,
            dashboardFilters,
            invalidateCache,
            sortKey,
            autoRefresh,
        ],
    );
    const apiChartAndResults =
        queryClient.getQueryData<ApiChartAndResults>(queryKey);

    const timezoneFixFilters =
        dashboardFilters && convertDateDashboardFilters(dashboardFilters);
    const hasADateDimension =
        !!apiChartAndResults?.metricQuery?.metadata?.hasADateDimension;

    const fetchChartAndResults = useCallback(
        () =>
            getChartAndResults({
                chartUuid: chartUuid!,
                dashboardUuid: dashboardUuid!,
                dashboardFilters: timezoneFixFilters,
                invalidateCache,
                dashboardSorts,
                granularity,
                autoRefresh,
            }),
        [
            chartUuid,
            dashboardUuid,
            timezoneFixFilters,
            invalidateCache,
            dashboardSorts,
            granularity,
            autoRefresh,
        ],
    );

    setChartsWithDateZoomApplied((prev) => {
        if (hasADateDimension) {
            if (granularity) {
                return (prev ?? new Set()).add(chartUuid!);
            }
            prev?.clear();
            return prev;
        }
        return prev;
    });

    return useQuery<ApiChartAndResults, ApiError>({
        queryKey:
            hasADateDimension && granularity
                ? queryKey.concat([granularity])
                : queryKey,
        queryFn: fetchChartAndResults,
        enabled: !!chartUuid && !!dashboardUuid,
        retry: false,
        refetchOnMount: false,
    });
};

const getChartVersionResults = async (
    chartUuid: string,
    versionUuid: string,
) => {
    return lightdashApi<ApiQueryResults>({
        url: `/saved/${chartUuid}/version/${versionUuid}/results`,
        method: 'POST',
        body: undefined,
    });
};

export const useChartVersionResultsMutation = (
    chartUuid: string,
    versionUuid?: string,
) => {
    const { showToastApiError } = useToaster();
    const mutation = useMutation<ApiQueryResults, ApiError>(
        () => getChartVersionResults(chartUuid, versionUuid!),
        {
            mutationKey: ['chartVersionResults', chartUuid, versionUuid],
            onError: ({ error }) => {
                showToastApiError({
                    title: 'Error running query',
                    apiError: error,
                });
            },
        },
    );
    const { mutateAsync } = mutation;
    // needs these args to work with ExplorerProvider
    const mutateAsyncOverride = useCallback(
        async (_tableName: string, _metricQuery: MetricQuery) => {
            await mutateAsync();
        },
        [mutateAsync],
    );

    return useMemo(
        () => ({
            ...mutation,
            mutateAsync: mutateAsyncOverride,
        }),
        [mutation, mutateAsyncOverride],
    );
};
