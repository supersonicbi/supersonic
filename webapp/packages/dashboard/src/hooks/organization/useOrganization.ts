import { type ApiError, type Organization } from '@lightdash/common';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { lightdashApi } from '../../api';
import { ORG_DATA } from '../../mocks/org';

const getOrganization = async () => {
    // return lightdashApi<Organization>({
    //     url: `/org`,
    //     method: 'GET',
    //     body: undefined,
    // });
    return ORG_DATA;
};

export const useOrganization = (
    useQueryOptions?: UseQueryOptions<Organization, ApiError>,
) =>
    useQuery<Organization, ApiError>({
        queryKey: ['organization'],
        queryFn: getOrganization,
        ...useQueryOptions,
    });
