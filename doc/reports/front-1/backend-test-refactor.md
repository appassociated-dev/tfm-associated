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
