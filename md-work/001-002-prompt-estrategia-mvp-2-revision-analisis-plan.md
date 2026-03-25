He revisado tu reporte.

Tengo una cuestión relacionada con el punto:

## 3.2. MODERADO - UC-007 (Estados del socio) y su relación con UC-013 (Baja)

En tu explicación planteas la siguiente recomendación, con dos opciones válidas:

- **Opción A (preferible):**
  Mover el **UC-007 (backend)** a la Fase 1. Esto implica implementar el `StatusHistory` y la máquina de transiciones desde el inicio, evitando retrabajo.

- **Opción B:**
  Mantener el **UC-007 en Fase 2**, pero diseñar el **UC-013 en Fase 1** incorporando ya la estructura de `StatusHistory` y las transiciones como parte del _Aggregate Member_, de modo que UC-007 solo añada las transiciones automáticas y la UI de consulta.

Sin embargo, en el planteamiento final no se incluye la Opción A y se adopta la Opción B, manteniendo el UC-007 en la Fase 1.

Imagino que tomas esta decisión al no tratarse de algo crítico, como en el caso del UC-010.

Se me ocurre que podríamos mover el **UC-007 a la Fase 1** y pasar el **UC-020 - Gestión de cargos manuales (backend)** a la Fase 2.

En mi opinión, el UC-020 no es crítico en la Fase 1; puede situarse en una etapa temprana de la Fase 2. Este movimiento permitiría mitigar el problema 3.2 sin una variación significativa del gradiente de trabajo.

Dame tu opinión.
