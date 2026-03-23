## Revisión de la estrategia de tests

Tenemos que revisar la estrategia de tests porque la situación es insostenible. No puede ser que hayamos llegado a este punto: si, para garantizar un desarrollo seguro, tenemos que estar ejecutando constantemente los tests y cada ejecución se queda bloqueada, al final cada acción nos cuesta entre 40 y 50 minutos, de los cuales el 90 % es tiempo en el que los procesos están bloqueados.

Debes revisar todo el volumen actual de tests. Se han generado tests sin control. Debes optimizar el número de tests existentes, porque ahora mismo es una barbaridad.

Estamos solo en la fase 1 de desarrollo y, teniendo en cuenta que hay tres fases de backend, ya llevamos más de 1.200 tests. Si no hacemos algo, cuando estemos en la fase 3 va a haber tal cantidad y volumen de tests que directamente no se van a poder ejecutar. Todo se va a quedar bloqueado.

## Puntos a revisar

### 1. Volumen de tests

Es necesario revisar y auditar exhaustivamente los tests actualmente implementados en el _workspace_ de API para determinar si realmente todos son necesarios. Estoy convencido de que hay mucho margen de optimización. Da la sensación de que se han ido generando tests sin un control claro, creando un volumen excesivo de pruebas para inflar un _coverage_ ficticio, únicamente con el objetivo de que pasen y de transmitir una falsa sensación de seguridad, en lugar de cumplir la función real de los tests: anticipar problemas y evitar que escalen hasta producción.

Esto está afectando de forma **grave y directa** a la eficiencia en el desarrollo de funcionalidades.

Esta tarea es **CRÍTICA Y NO NEGOCIABLE**.

Los tests unitarios tienen que validar el _happy path_, pero también deben aplicar técnicas de triangulación para evitar problemas de _Fake It_ (_hardcoded_) y obligar a implementar las generalidades de la lógica.

La auditoría exhaustiva también tiene que ir en esa línea. Es decir, debe auditar tanto la eficiencia como la eficacia.

### 2. Separación por _bounded context_

Una vez realizada la auditoría, debemos implementar una estrategia de separación de test por capas. Una estrategia que se me ocurre sería implementar una separación por _bounded context_. La arquitectura del proyecto es un monolito modular en el que cada _Bounded Context_ (KB-005) se implementa como un módulo independiente dentro de una única aplicación desplegable. Esta arquitectura hace que cada módulo sea, en cierto sentido, independiente, por lo que también tendría sentido organizar los tests de acuerdo con esa estructura.

De esta manera, si estoy trabajando en algo relacionado con **BC-Identity**, podría ejecutar solo esa capa de tests sin necesidad de lanzar también los tests de **BC-Memberships**, por ejemplo. Puede haber una capa de tests más transversales cuya ejecución sea necesaria para todas las capas, pero creo que tenemos que hacer algo porque, si no, va a ser imposible trabajar con eficiencia.

Algo como esto:

```json
{
  ...
  "scripts": {
    ...
    "test:unit": "vitest run --config vitest.unit.transversal.config.ts && vitest run --config vitest.unit.bcidentity.config.ts && vitest run --config vitest.unit.bc{another_bc}.config.ts && ...",
    "test:unit:transversal": "vitest run --config vitest.unit.transversal.config.ts",
    "test:unit:bcidentity": "vitest run --config vitest.unit.transversal.config.ts && vitest run --config vitest.unit.bcidentity.config.ts",
    "test:unit:bc{another_bc}": "vitest run --config vitest.unit.transversal.config.ts && vitest run --config vitest.unit.bc{another_bc}.config.ts",
    ...
    "test:integration": "vitest run --config vitest.integration.transversal.config.ts && vitest run --config vitest.integration.bcidentity.config.ts && vitest run --config vitest.integration.bc{another_bc}.config.ts && ...",
    "test:integration:transversal": "vitest run --config vitest.integration.transversal.config.ts",
    "test:integration:bcidentity": "vitest run --config vitest.integration.transversal.config.ts && vitest run --config vitest.integration.bcidentity.config.ts",
    "test:integration:bc{another_bc}": "vitest run --config vitest.integration.transversal.config.ts && vitest run --config vitest.integration.bc{another_bc}.config.ts",
    ...
    "test:cov": "vitest run --config vitest.unit.transversal.config.ts --coverage && vitest run --config vitest.unit.bcidentity.config.ts --coverage && vitest run --config vitest.unit.bc{another_bc}.config.ts --coverage && ...",
    "test:cov:transversal": "vitest run --config vitest.unit.transversal.config.ts --coverage",
    "test:cov:bcidentity": "vitest run --config vitest.unit.transversal.config.ts --coverage && vitest run --config vitest.unit.bcidentity.config.ts --coverage",
    "test:cov:bc{another_bc}": "vitest run --config vitest.unit.transversal.config.ts --coverage && vitest run --config vitest.unit.bc{another_bc}.config.ts --coverage",
    ...
    "test:e2e": "vitest run --config vitest.e2e.transversal.config.ts && vitest run --config vitest.e2e.bcidentity.config.ts && vitest run --config vitest.e2e.bc{another_bc}.config.ts && ...",
    "test:e2e:transversal": "vitest run --config vitest.e2e.transversal.config.ts",
    "test:e2e:bcidentity": "vitest run --config vitest.e2e.transversal.config.ts && vitest run --config vitest.e2e.bcidentity.config.ts",
    "test:e2e:bc{another_bc}": "vitest run --config vitest.e2e.transversal.config.ts && vitest run --config vitest.e2e.bc{another_bc}.config.ts"
  },
  ...
}
```

## Propuesta de enfoque

Esto que planteo es solo una propuesta. Desconozco si es viable o no y también si puede existir algún otro enfoque mejor. Pero tenemos que ver de qué manera organizamos los tests para que la ejecución en desarrollo sea eficiente.

Esto no quita que exista un script en el `package.json` para ejecutar todos los tests, pero sí creo que, para el trabajo diario, deberíamos establecer una estrategia en la que solo se ejecuten los tests necesarios.

Porque, si en cada implementación se ejecutan todos los tests, va a llegar un momento en el que no vamos a poder ejecutar nada: cada cambio nos va a dejar completamente bloqueados.
