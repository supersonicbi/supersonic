import {
    LightdashRequestMethodHeader,
    RequestMethod,
    type ApiError,
    type ApiResponse,
} from '@lightdash/common';
import * as Sentry from '@sentry/react';
import fetch from 'isomorphic-fetch';

export const BASE_API_URL =
    import.meta.env.VITEST === 'true'
        ? `http://test.lightdash/`
        : import.meta.env.BASE_URL;

const defaultHeaders = {
    'Content-Type': 'application/json',
    [LightdashRequestMethodHeader]: RequestMethod.WEB_APP,
};

const handleError = (err: any): ApiError => {
    if (err.error?.statusCode && err.error?.name) return err;
    return {
        status: 'error',
        error: {
            name: 'NetworkError',
            statusCode: 500,
            message:
                'We are currently unable to reach the Lightdash server. Please try again in a few moments.',
            data: err,
        },
    };
};

type LightdashApiProps = {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    url: string;
    body: BodyInit | null | undefined;
    headers?: Record<string, string> | undefined;
    version?: 'v1' | 'v2';
};
export const lightdashApi = async <T extends ApiResponse['results']>({
    method,
    url,
    body,
    headers,
    version = 'v1',
}: LightdashApiProps): Promise<T> => {
    const isSupersonicApi = url.includes('supersonic');
    const apiPrefix = isSupersonicApi ? '' : `${BASE_API_URL}api/${version}`;

    let sentryTrace: string | undefined;
    // Manually create a span for the fetch request to be able to trace it in Sentry. This also enables Distributed Tracing.
    Sentry.startSpan(
        {
            op: 'http.client',
            name: `API Request: ${method} ${url}`,
            attributes: {
                'http.method': method,
                'http.url': url,
                type: 'fetch',
                url,
                method,
            },
        },
        (s) => {
            sentryTrace = Sentry.spanToTraceHeader(s);
        },
    );

    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get('token');
    if (urlToken) {
        localStorage.setItem('SUPERSONIC_TOKEN', urlToken);
    }

    const token = isSupersonicApi
        ? localStorage.getItem('SUPERSONIC_TOKEN') || ''
        : '';

    return fetch(`${apiPrefix}${url}`, {
        method,
        headers: {
            ...defaultHeaders,
            ...headers,
            ...(sentryTrace ? { 'sentry-trace': sentryTrace } : {}),
            Authorization: !isSupersonicApi ? '' : `Bearer ${token}`,
        },
        body,
    })
        .then((r) => {
            if (!r.ok) {
                return r.json().then((d) => {
                    throw d;
                });
            }
            return r;
        })
        .then((r) => r.json())
        .then((d: (ApiResponse | ApiError) & { data: T; msg: string }) => {
            if (isSupersonicApi) {
                switch (d.msg) {
                    case 'success':
                        // make sure we return null instead of undefined
                        // otherwise react-query will crash
                        return (d.data ?? null) as T;
                    default:
                        throw d;
                }
            } else {
                switch (d.status) {
                    case 'ok':
                        // make sure we return null instead of undefined
                        // otherwise react-query will crash
                        return (d.results ?? null) as T;
                    case 'error':
                        throw d;
                    default:
                        throw d;
                }
            }
        })
        .catch((err) => {
            throw handleError(err);
        });
};
