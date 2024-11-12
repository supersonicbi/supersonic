import { type ApiError, type ApiExploreResults } from '@lightdash/common';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { lightdashApi } from '../api';
import useQueryError from './useQueryError';
import { DOMAIN_ID } from '../utils/contants';

const getExplore = async (projectUuid: string, exploreId: string) =>
    lightdashApi<ApiExploreResults>({
        url: `/projects/${projectUuid}/explores/${exploreId}`,
        method: 'GET',
        body: undefined,
    });

export const useExploreBak = (
    activeTableName: string | undefined,
    useQueryOptions?: UseQueryOptions<ApiExploreResults, ApiError>,
) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const setErrorResponse = useQueryError();
    const queryKey = ['tables', activeTableName, projectUuid];
    return useQuery<ApiExploreResults, ApiError>({
        queryKey,
        queryFn: () => getExplore(projectUuid, activeTableName || ''),
        enabled: !!activeTableName,
        onError: (result) => setErrorResponse(result),
        retry: false,
        ...useQueryOptions,
    });
};

const getDataSet = async (domainId: string, dataSetId: string) => {
    const res = await lightdashApi<any>({
        url: `/supersonic/api/semantic/dataSet/getDataSetList?domainId=${domainId}`,
        method: 'GET',
        body: undefined,
    });
    const { name, description, allDimensions, allMetrics } =
        res.find((item: any) => item.id === +dataSetId) || {};
    const [dimensions, metrics] = await Promise.all([
        lightdashApi<any>({
            url: '/supersonic/api/semantic/dimension/queryDimension',
            method: 'POST',
            body: JSON.stringify({
                ids: (allDimensions || []).map((item: any) => item.itemId),
                current: 1,
                pageSize: 999999,
            }),
        }),
        lightdashApi<any>({
            url: '/supersonic/api/semantic/metric/queryMetric',
            method: 'POST',
            body: JSON.stringify({
                ids: (allMetrics || []).map((item: any) => item.itemId),
                current: 1,
                pageSize: 999999,
            }),
        }),
    ]);
    return {
        baseTable: dataSetId,
        groupLabel: '',
        joinedTables: [],
        label: name,
        name: dataSetId,
        sqlPath: 'dbt_orders.sql',
        tables: {
            [dataSetId]: {
                database: 'thyme',
                description,
                dimensions: (dimensions?.list || []).reduce(
                    (result: any, item: any, index: number) => {
                        result[item.bizName] = {
                            compiledSql: '"dbt_orders".basket_total',
                            description: item.description,
                            fieldType: 'dimension',
                            format: '',
                            groups: [],
                            hidden: false,
                            isIntervalBase: false,
                            index,
                            label: item.name,
                            name: item.bizName,
                            sql: '${TABLE}.basket_total',
                            table: dataSetId,
                            tableLabel: name,
                            tablesReferences: [dataSetId],
                            tablesRequiredAttributes: {
                                [dataSetId]: { can_access_orders: true },
                            },
                            type: 'string',
                        };
                        return result;
                    },
                    {},
                ),
                metrics: (metrics?.list || []).reduce(
                    (result: any, item: any, index: number) => {
                        result[item.bizName] = {
                            compiledSql: '"dbt_orders".basket_total',
                            description: item.description,
                            fieldType: 'metric',
                            format: '',
                            groups: [],
                            hidden: false,
                            isIntervalBase: false,
                            index,
                            label: item.name,
                            name: item.bizName,
                            sql: '${TABLE}.basket_total',
                            table: dataSetId,
                            tableLabel: name,
                            tablesReferences: [dataSetId],
                            tablesRequiredAttributes: {
                                [dataSetId]: { can_access_orders: true },
                            },
                            type: 'number',
                        };
                        return result;
                    },
                    {},
                ),
                groupDetails: {},
                groupLabel: '',
                label: name,
                lineageGraph: {
                    [dataSetId]: [],
                },
                name: dataSetId,
                orderFieldsBy: 'LABEL',
                requiredAttributes: {
                    can_access_orders: 'true',
                },
                requiredFilters: [],
                schema: 'thyme',
                sqlTable: '"thyme"."thyme"."dbt_orders"',
            },
        },
        tags: ['not_lightdash'],
        targetDatabase: 'postgres',
        ymlPath: 'models/dbt_orders.yml',
    } as ApiExploreResults;
};

export const useExplore = (
    activeDataSetId: string | undefined,
    useQueryOptions?: UseQueryOptions<ApiExploreResults, ApiError>,
) => {
    const setErrorResponse = useQueryError();
    const queryKey = ['tables', activeDataSetId, DOMAIN_ID];
    return useQuery<ApiExploreResults, ApiError>({
        queryKey,
        queryFn: () => getDataSet(DOMAIN_ID, activeDataSetId || ''),
        enabled: !!activeDataSetId,
        onError: (result) => setErrorResponse(result),
        retry: false,
        ...useQueryOptions,
    });
};
