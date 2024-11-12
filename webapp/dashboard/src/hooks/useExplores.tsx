import { type ApiError, type ApiExploresResults } from '@lightdash/common';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { lightdashApi } from '../api';
import useQueryError from './useQueryError';

const getExplores = async (projectUuid: string, filtered?: boolean) =>
    lightdashApi<ApiExploresResults>({
        url: `/projects/${projectUuid}/explores?filtered=${
            filtered ? 'true' : 'false'
        }`,
        method: 'GET',
        body: undefined,
    });

export const useExplores = (
    projectUuid: string,
    filtered?: boolean,
    useQueryFetchOptions?: UseQueryOptions<ApiExploresResults, ApiError>,
) => {
    const setErrorResponse = useQueryError();
    const queryKey = ['tables', projectUuid, filtered ? 'filtered' : 'all'];
    return useQuery<ApiExploresResults, ApiError>({
        queryKey,
        queryFn: () => getExplores(projectUuid, filtered),
        onError: (result) => setErrorResponse(result),
        retry: false,
        ...useQueryFetchOptions,
    });
};

const getDataSets = async (domainId: string) => {
    const res = await lightdashApi<ApiExploresResults>({
        url: `/supersonic/api/semantic/dataSet/getDataSetList?domainId=${domainId}`,
        method: 'GET',
        body: undefined,
    });
    return res.map(({ id, name, bizName, description }: any) => ({
        databaseName: bizName,
        description,
        groupLabel: '',
        label: name,
        name: id,
        schemaName: bizName,
        tags: [],
        type: 'default',
    }));
};

export const useDataSets = (
    domainId: string,
    filtered?: boolean,
    useQueryFetchOptions?: UseQueryOptions<ApiExploresResults, ApiError>,
) => {
    const setErrorResponse = useQueryError();
    const queryKey = ['tables', domainId, filtered ? 'filtered' : 'all'];
    return useQuery<ApiExploresResults, ApiError>({
        queryKey,
        queryFn: () => getDataSets(domainId),
        onError: (result) => setErrorResponse(result),
        retry: false,
        ...useQueryFetchOptions,
    });
};
