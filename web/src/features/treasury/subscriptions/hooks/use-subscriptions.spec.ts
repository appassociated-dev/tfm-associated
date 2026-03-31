// Tests para useSubscriptions — hook de query que obtiene
// suscripciones (activa + historicas) de un socio.

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildMemberSubscriptionsResponse, buildSubscription } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useSubscriptions } from './use-subscriptions';

// === Datos de prueba ===

const ACCOUNT_ID = 'f47ac10b-58cc-4372-a567-0000000000a1';
const ACCOUNT_ID_2 = 'f47ac10b-58cc-4372-a567-0000000000a2';

describe('useSubscriptions', () => {
  it('deberia retornar suscripciones cuando la consulta es exitosa', async () => {
    // Arrange
    const data = buildMemberSubscriptionsResponse({
      memberId: ACCOUNT_ID,
      activeSubscription: buildSubscription(),
    });
    server.use(
      http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
        return HttpResponse.json(apiResponse(data));
      }),
    );

    // Act
    const { result } = renderHook(() => useSubscriptions(ACCOUNT_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.activeSubscription).not.toBeNull();
    expect(result.current.data?.memberAccountId).toBeDefined();
  });

  it('deberia retornar socio sin suscripcion activa', async () => {
    // Arrange
    const data = buildMemberSubscriptionsResponse({
      memberId: ACCOUNT_ID,
      activeSubscription: null,
      history: [buildSubscription({ cancelReason: 'MEMBER_LEAVE' })],
    });
    server.use(
      http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
        return HttpResponse.json(apiResponse(data));
      }),
    );

    // Act
    const { result } = renderHook(() => useSubscriptions(ACCOUNT_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.activeSubscription).toBeNull();
    expect(result.current.data?.history).toHaveLength(1);
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
        return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
      }),
    );

    // Act
    const { result } = renderHook(() => useSubscriptions(ACCOUNT_ID));

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('no deberia ejecutar query con accountId vacio', () => {
    // Act
    const { result } = renderHook(() => useSubscriptions(''));

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('deberia usar queryKey distinto segun accountId (triangulacion)', async () => {
    // Arrange
    let callCount = 0;
    server.use(
      http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
        callCount++;
        return HttpResponse.json(apiResponse(buildMemberSubscriptionsResponse()));
      }),
    );

    // Act
    const { result: r1 } = renderHook(() => useSubscriptions(ACCOUNT_ID));
    await waitFor(() => expect(r1.current.isSuccess).toBe(true));

    const { result: r2 } = renderHook(() => useSubscriptions(ACCOUNT_ID_2));
    await waitFor(() => expect(r2.current.isSuccess).toBe(true));

    // Assert — ambas queries se ejecutaron
    expect(callCount).toBe(2);
  });
});
