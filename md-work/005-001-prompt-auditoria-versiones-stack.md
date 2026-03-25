Acabo de identificar una situación que me preocupa: **Zod 3.x** es la versión definida en el stack, pero:

- **zod v3.0.0** - May 17, 2021
- **zod v4.0.0** - Jul 10, 2025

Necesito que investigues las versiones actuales de **todas las dependencias del stack**. Deja de lado el proyecto de Prowler; únicamente fue un ejemplo para ilustrar el enfoque que quiero aplicar en las instrucciones.

Recuerda que cuentas con el _skill_ **doc-spec-generator** para trabajar con las `spec/` del proyecto.

Requiero una **investigación exhaustiva** de las dependencias definidas, con el objetivo de determinar si se trata de versiones obsoletas o significativamente antiguas y si existen versiones estables superiores disponibles.

La revisión debe realizarse siguiendo un **orden lógico del stack**, asegurando la compatibilidad entre dependencias y priorizando los componentes de menor nivel antes de analizar aquellos que dependen de ellos, conforme a la siguiente secuencia:

- **Runtime**
- **Frameworks**
- **Librerías**
