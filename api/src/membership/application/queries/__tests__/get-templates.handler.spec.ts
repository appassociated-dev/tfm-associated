import { describe, it, expect, beforeEach } from 'vitest';
import { GetTemplatesHandler } from '../get-templates.handler';
import { GetTemplatesQuery } from '../get-templates.query';

describe('GetTemplatesHandler', () => {
  let handler: GetTemplatesHandler;

  beforeEach(() => {
    handler = new GetTemplatesHandler();
  });

  it('debería devolver plantillas para COFRADIA', async () => {
    const query = new GetTemplatesQuery('COFRADIA');
    const result = await handler.execute(query);

    expect(result.length).toBe(4);
    expect(result[0].code).toBe('NUMERARIO');
    expect(result[1].code).toBe('HONORARIO');
  });

  it('debería devolver plantillas para PENA', async () => {
    const query = new GetTemplatesQuery('PENA');
    const result = await handler.execute(query);

    expect(result.length).toBe(4);
    expect(result[0].code).toBe('ADULTO');
  });

  it('debería devolver plantillas para CLUB_DEPORTIVO', async () => {
    const query = new GetTemplatesQuery('CLUB_DEPORTIVO');
    const result = await handler.execute(query);

    expect(result.length).toBe(4);
    expect(result[0].code).toBe('SOCIO_CLUB');
  });

  it('debería devolver plantillas para ASOCIACION_CULTURAL', async () => {
    const query = new GetTemplatesQuery('ASOCIACION_CULTURAL');
    const result = await handler.execute(query);

    expect(result.length).toBe(4);
    expect(result[0].code).toBe('ORDINARIO');
  });

  it('debería devolver lista vacía para tipo desconocido', async () => {
    const query = new GetTemplatesQuery('UNKNOWN');
    const result = await handler.execute(query);

    expect(result.length).toBe(0);
  });
});
