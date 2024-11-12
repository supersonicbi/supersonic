import {
    type ApiError,
    type ApiHealthResults,
    type HealthState,
} from '@lightdash/common';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { lightdashApi } from '../../api';
import useQueryError from '../useQueryError';
import { HEALTH_DATA } from '../../mocks/health';

const getHealthState = async () => {
    // const res = await lightdashApi<ApiHealthResults>({
    //     url: `/health`,
    //     method: 'GET',
    //     body: undefined,
    // });
    return HEALTH_DATA;
};

const useHealth = (
    useQueryOptions?: UseQueryOptions<HealthState, ApiError>,
) => {
    const setErrorResponse = useQueryError();

    const health = useQuery<HealthState, ApiError>({
        queryKey: ['health'],
        queryFn: getHealthState,
        onError: (result) => {
            setErrorResponse(result);
        },
        ...useQueryOptions,
    });

    return health;
};

export default useHealth;
