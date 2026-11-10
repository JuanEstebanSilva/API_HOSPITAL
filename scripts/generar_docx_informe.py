import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_DIR = os.path.abspath("Informes")
os.makedirs(OUTPUT_DIR, exist_ok=True)
DOCX_PATH = os.path.join(OUTPUT_DIR, "2.2_Informe_Evidencias_API_Hospital.docx")
EVIDENCIAS_DIR = os.path.abspath("Evidencias_2.2")

def set_cell_shading(cell, color_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    """
    kwargs: top, bottom, left, right
    values: dict(sz=4, val='single', color='D3D3D3')
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = f'w:{edge}'
            element = OxmlElement(tag)
            element.set(qn('w:val'), edge_data.get('val', 'single'))
            element.set(qn('w:sz'), str(edge_data.get('sz', 4)))
            element.set(qn('w:space'), '0')
            element.set(qn('w:color'), edge_data.get('color', 'CCCCCC'))
            tcBorders.append(element)
    tcPr.append(tcBorders)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0x2E, 0x40, 0x53)
    return p

def add_body_paragraph(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.size = Pt(11.5)
        r_pre.font.bold = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(11.5)
    return p

def add_figure_item(doc, fig_num, fig_title, img_filename, description):
    img_path = os.path.join(EVIDENCIAS_DIR, img_filename)
    
    # 1. Epígrafe superior
    p_label = doc.add_paragraph()
    p_label.paragraph_format.space_before = Pt(10)
    p_label.paragraph_format.space_after = Pt(4)
    p_label.paragraph_format.keep_with_next = True
    p_label.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_fig = p_label.add_run(f"Figura {fig_num}. ")
    r_fig.font.name = "Times New Roman"
    r_fig.font.size = Pt(9.5)
    r_fig.font.bold = True
    r_title = p_label.add_run(fig_title)
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(9.5)
    r_title.font.italic = False

    # 2. Imagen centrada
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.paragraph_format.space_before = Pt(2)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.paragraph_format.keep_with_next = True
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(4.5))
    else:
        p_img = doc.add_paragraph(f"[AVISO: Imagen {img_filename} no encontrada en {EVIDENCIAS_DIR}]")
        p_img.paragraph_format.space_after = Pt(4)
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # 3. Descripción técnica (aprox 3 líneas, justificada, 10.5 pt)
    p_desc = doc.add_paragraph()
    p_desc.paragraph_format.space_before = Pt(2)
    p_desc.paragraph_format.space_after = Pt(10)
    p_desc.paragraph_format.line_spacing = 1.15
    p_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r_desc = p_desc.add_run(description)
    r_desc.font.name = "Times New Roman"
    r_desc.font.size = Pt(10.5)

def build_informe():
    doc = Document()

    # Configurar márgenes estándar (1 pulgada / 2.54 cm)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # -------------------------------------------------------------
    # TÍTULO PRINCIPAL (16 pt, Negrita, Times New Roman)
    # -------------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(12)
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r_title = p_title.add_run("2.2. Evidencias de actualización y verificación de la API Hospital")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)

    # -------------------------------------------------------------
    # 1. INTRODUCCIÓN Y CONTEXTO TÉCNICO
    # -------------------------------------------------------------
    add_heading_1(doc, "1. Introducción y Alcance de la Auditoría")
    add_body_paragraph(
        doc,
        "El presente informe documenta de manera exhaustiva las evidencias técnicas obtenidas durante el proceso "
        "de auditoría, ejecución de pruebas de integración y verificación en base de datos para la API Hospital. "
        "Las actividades se desarrollaron bajo estricto cumplimiento de los requerimientos y especificaciones "
        "establecidos en la guía técnica del proyecto (README 11), garantizando la integridad referencial, el robustecimiento "
        "de los mecanismos de autenticación y autorización, la mitigación de vulnerabilidades de control de acceso (BOLA/IDOR), "
        "la gestión segura del ciclo de vida de contraseñas mediante tokens criptográficos y códigos de respaldo, así como el "
        "desacoplamiento arquitectónico entre credenciales de servicio (API Key) y credenciales de usuario (JWT)."
    )
    add_body_paragraph(
        doc,
        "Todas las capturas de pantalla integradas en este documento constituyen evidencias reales, recolectadas directamente "
        "desde las herramientas en ejecución: la interfaz interactiva OpenAPI/Swagger UI (http://localhost:3000/api-docs), "
        "la consola de comandos del sistema y las sesiones activas de conexión a la base de datos PostgreSQL alojada en Supabase. "
        "No se emplearon datos simulados ni entornos ficticios, preservando la fidelidad técnica exigida para el aseguramiento de la calidad."
    )

    # -------------------------------------------------------------
    # 2. VERIFICACIÓN DE LA BASE DE DATOS
    # -------------------------------------------------------------
    add_heading_1(doc, "2. Verificación Estructural y de Seguridad en Base de Datos (Supabase / PostgreSQL)")
    add_body_paragraph(
        doc,
        "Previo a la ejecución de las pruebas funcionales HTTP, se procedió a auditar el esquema relacional en la instancia "
        "de PostgreSQL administrada en Supabase. Se constató la coexistencia armónica de las siete tablas troncales preexistentes "
        "con las dos nuevas estructuras requeridas para la recuperación de credenciales (password_reset_tokens y codigos_recuperacion), "
        "así como la incorporación de la columna version_sesion en la tabla usuarios. Las siguientes figuras certifican la correcta "
        "aplicación de las migraciones DDL sin alteraciones destructivas ni pérdida de registros."
    )

    # Fig 1
    add_figure_item(
        doc, 1,
        "Esquema relacional de 9 tablas propias y activación de Row Level Security (RLS)",
        "fig01_bd_9tablas_rls.png",
        "Inspección de las 9 tablas del esquema público en PostgreSQL mediante consulta al catálogo pg_tables. "
        "Se verifica la persistencia de las entidades troncales y las dos nuevas tablas de seguridad, confirmando "
        "que todas cuentan con la propiedad rowsecurity activada (TRUE) como salvaguarda a nivel de motor relacional."
    )

    # Fig 2
    add_figure_item(
        doc, 2,
        "Estructura y atributos de la columna version_sesion en la tabla usuarios",
        "fig02_bd_version_sesion.png",
        "Verificación de la columna version_sesion en la tabla usuarios consultando information_schema.columns. "
        "Se constata su definición como tipo INTEGER, obligatoriedad NOT NULL y valor predeterminado 0, componente "
        "esencial para la invalidación inmediata de tokens JWT ante modificaciones en las credenciales del usuario."
    )

    # Fig 3
    add_figure_item(
        doc, 3,
        "Definición y tipos de datos en tablas password_reset_tokens y codigos_recuperacion",
        "fig03_bd_estructura_nuevas_tablas.png",
        "Auditoría de columnas en las nuevas tablas de recuperación. Se comprueba el almacenamiento exclusivo de hashes "
        "criptográficos (token_hash y codigo_hash con estándar SHA-256 en cadenas de 64 caracteres hex) y marcas de tiempo "
        "para fecha_creacion, fecha_expiracion y fecha_uso, previniendo la exposición de secretos en reposo."
    )

    # Fig 4
    add_figure_item(
        doc, 4,
        "Integridad referencial y claves foráneas hacia la entidad usuarios",
        "fig04_bd_claves_foraneas.png",
        "Consulta de restricciones de clave foránea en pg_constraint. Se comprueba que tanto password_reset_tokens como "
        "codigos_recuperacion poseen llaves foráneas válidas referenciando a usuarios(id) con política ON DELETE CASCADE, "
        "asegurando la coherencia relacional y la eliminación automática en cascada ante bajas de cuentas de usuario."
    )

    # Fig 5
    add_figure_item(
        doc, 5,
        "Índices de búsqueda y restricciones de unicidad para rendimiento y seguridad",
        "fig05_bd_indices_restricciones.png",
        "Listado de índices de base de datos en pg_indexes para las estructuras agregadas. Se constatan índices B-Tree "
        "optimizados sobre columnas críticas (usuario_id, token_hash, codigo_hash y fecha_uso), permitiendo validaciones "
        "en tiempo constante O(1) y evitando bloqueos de tabla durante picos de solicitudes de autenticación."
    )

    # Fig 6
    add_figure_item(
        doc, 6,
        "Diagnóstico de la conexión del backend y evaluación del privilegio BYPASSRLS",
        "fig06_bd_diagnostico_conexion_backend.png",
        "Comprobación de la identidad activa de conexión ejecutada a través del pool pg del backend en Node.js. "
        "Se evidencia que la conexión opera bajo el rol administrativo postgres, el cual posee rolbypassrls = true, "
        "demostrando que la verdadera frontera de aislamiento de datos radica en los middlewares de Express y no en RLS."
    )

    # -------------------------------------------------------------
    # 3. EJECUCIÓN DE PRUEBAS HTTP EN SWAGGER UI
    # -------------------------------------------------------------
    add_heading_1(doc, "3. Ejecución y Evidencias de Pruebas de Seguridad en Swagger UI")
    add_body_paragraph(
        doc,
        "Las 25 pruebas estipuladas en el Paso 8 del README 11 fueron ejecutadas de forma sistemática utilizando "
        "la documentación viva de OpenAPI/Swagger UI. A continuación, se presentan las capturas categorizadas por "
        "dominio funcional, exponiendo el comportamiento de los endpoints ante credenciales legítimas, vectores de ataque "
        "y solicitudes malformadas."
    )

    # 3.1 Autenticación y Contraseñas
    add_heading_2(doc, "3.1. Autenticación, Ciclo de Vida de Contraseña y Revocación de Sesión")

    # Fig 7
    add_figure_item(
        doc, 7,
        "Prueba 1: Autenticación exitosa mediante credenciales válidas en POST /api/auth/login",
        "fig07_p01_login_valido.png",
        "Envío de credenciales válidas de usuario mediante Swagger UI hacia el endpoint de inicio de sesión. "
        "La API retorna exitosamente HTTP 200 OK junto con un token JWT firmado que encapsula id, rol y la version_sesion "
        "actual del usuario, permitiendo el acceso subsecuente a los módulos autorizados del sistema hospitalario."
    )

    # Fig 8
    add_figure_item(
        doc, 8,
        "Prueba 2: Rechazo de solicitud con estructura de datos inválida en POST /api/auth/login",
        "fig08_p02_login_invalido.png",
        "Transmisión de un cuerpo JSON con formato de correo electrónico malformado y contraseña incompleta. "
        "El middleware de validación intercepta la petición y responde con código HTTP 400 Bad Request, impidiendo "
        "que parámetros defectuosos alcancen los controladores de negocio o disparen consultas innecesarias a la base de datos."
    )

    # Fig 9
    add_figure_item(
        doc, 9,
        "Prueba 3: Protección de ruta privada ante ausencia de token en GET /api/auth/perfil",
        "fig09_p03_perfil_sin_jwt.png",
        "Intento de consulta del perfil de usuario sin proporcionar el encabezado de autorización Bearer. "
        "El middleware autenticarJWT bloquea inmediatamente el acceso emitiendo HTTP 401 Unauthorized con el mensaje "
        "'Token no proporcionado', confirmando la hermeticidad de las rutas protegidas frente a clientes no identificados."
    )

    # Fig 10
    add_figure_item(
        doc, 10,
        "Prueba 4: Modificación legítima de contraseña con incremento de version_sesion",
        "fig10_p04_cambio_password_exitoso.png",
        "Ejecución de PATCH /api/auth/cambiar-password suministrando la contraseña vigente y una nueva clave válida. "
        "El servicio valida el hash actual mediante bcrypt, actualiza la contraseña, incrementa atómicamente version_sesion "
        "a 1 y responde HTTP 200 OK con un nuevo token, invalidando automáticamente todas las sesiones previas."
    )

    # Fig 11
    add_figure_item(
        doc, 11,
        "Prueba 5: Invalidación y rechazo de JWT previo con version_sesion obsoleta",
        "fig11_p05_jwt_revocado.png",
        "Presentación deliberada del token JWT original (emitido con version_sesion = 0) ante GET /api/auth/perfil. "
        "El middleware verifica la versión almacenada en base de datos (1) frente a la del token (0) y deniega el acceso "
        "con HTTP 401 Unauthorized ('Sesión invalidada'), demostrando la efectividad del mecanismo de revocación instantánea."
    )

    # Fig 12
    add_figure_item(
        doc, 12,
        "Prueba 6: Inicio de sesión exitoso empleando la nueva credencial en POST /api/auth/login",
        "fig12_p06_login_nueva_password.png",
        "Autenticación con la contraseña recién actualizada a través de Swagger UI. "
        "La API autentica satisfactoriamente las credenciales contra el nuevo hash bcrypt, retornando HTTP 200 OK "
        "y un JWT actualizado con version_sesion = 1, restableciendo el acceso operativo del usuario en el sistema."
    )

    # Fig 13
    add_figure_item(
        doc, 13,
        "Prueba 7: Rechazo de cambio de contraseña ante contraseña actual incorrecta",
        "fig13_p07_cambio_password_incorrecta.png",
        "Solicitud de cambio de clave suministrando una contraseña actual errónea. "
        "La validación criptográfica en el controlador detecta la discrepancia y retorna HTTP 400 Bad Request "
        "('La contraseña actual es incorrecta'), manteniendo inalterados el hash almacenado y el contador de sesión."
    )

    # 3.2 Recuperación Administrativa
    add_heading_2(doc, "3.2. Recuperación Administrativa de Contraseñas")

    # Fig 14
    add_figure_item(
        doc, 14,
        "Prueba 8: Generación de token temporal de recuperación por el Administrador",
        "fig14_p08_admin_genera_token.png",
        "Invocación de POST /api/auth/recuperacion/admin/{usuarioId} por parte de un usuario con rol 'administrador'. "
        "El servidor genera un token criptográfico aleatorio, almacena su hash SHA-256 con vigencia de 1 hora y responde "
        "HTTP 200 OK con el token en texto claro para su entrega segura al usuario, sin exponer la contraseña."
    )

    # Fig 15
    add_figure_item(
        doc, 15,
        "Prueba 9: Restablecimiento de credenciales mediante token administrativo válido",
        "fig15_p09_restablecer_token_valido.png",
        "Consumo del token de recuperación en POST /api/auth/restablecer-password adjuntando la nueva contraseña deseada. "
        "El sistema valida la vigencia temporal y estado de no uso del token, actualiza la clave en usuarios, incrementa la "
        "versión de sesión, marca el token como consumido (fecha_uso) y responde satisfactoriamente con HTTP 200 OK."
    )

    # Fig 16
    add_figure_item(
        doc, 16,
        "Prueba 10: Detección y rechazo de reutilización de token de recuperación consumido",
        "fig16_p10_reutilizacion_token.png",
        "Segundo intento de envío del mismo token de recuperación hacia POST /api/auth/restablecer-password. "
        "La consulta comprueba que fecha_uso ya no es nula, rechazando la operación de inmediato con HTTP 400 Bad Request "
        "('Token inválido o expirado'), neutralizando ataques de repetición (replay attacks)."
    )

    # Fig 17
    add_figure_item(
        doc, 17,
        "Prueba 11: Bloqueo RBAC a usuario no administrador en endpoint de recuperación",
        "fig17_p11_no_admin_recuperacion.png",
        "Intento de emisión de token administrativo por parte de un usuario con rol 'paciente'. "
        "El middleware autorizarRoles evalúa el rol contenido en el JWT y deniega rotundamente la acción emitiendo "
        "HTTP 403 Forbidden ('Acceso denegado: rol insuficiente'), preservando el principio de mínimo privilegio."
    )

    # 3.3 Códigos de Recuperación
    add_heading_2(doc, "3.3. Códigos de Recuperación de Respaldo")

    # Fig 18
    add_figure_item(
        doc, 18,
        "Prueba 12: Generación de ocho códigos de respaldo para el usuario autenticado",
        "fig18_p12_generar_codigos.png",
        "Llamada a POST /api/auth/codigos-recuperacion confirmando la contraseña vigente del usuario. "
        "El backend genera 8 códigos alfanuméricos únicos en formato XXXX-XXXX, persiste sus hashes SHA-256 en la base "
        "de datos y retorna HTTP 201 Created con el listado plano, advirtiendo al usuario que guarde sus claves de emergencia."
    )

    # Fig 19
    add_figure_item(
        doc, 19,
        "Prueba 13: Consulta de saldo y disponibilidad en GET /api/auth/codigos-recuperacion/estado",
        "fig19_p13_estado_codigos.png",
        "Petición autenticada para verificar el balance de códigos de respaldo del usuario. "
        "El servicio responde HTTP 200 OK indicando el conteo de códigos generados (8), disponibles (8) y utilizados (0) "
        "junto con la fecha del lote, sin revelar en ningún momento los hashes ni los valores en texto plano."
    )

    # Fig 20
    add_figure_item(
        doc, 20,
        "Prueba 14: Regeneración de códigos de respaldo con invalidación del lote previo",
        "fig20_p14_regenerar_codigos.png",
        "Invocación de POST /api/auth/codigos-recuperacion/regenerar previa confirmación de clave. "
        "El sistema invalida irrevocablemente todos los códigos emitidos anteriormente asignándoles fecha_uso = NOW(), "
        "inserta un nuevo lote de 8 códigos frescos y devuelve HTTP 200 OK con el nuevo juego de claves de seguridad."
    )

    # Fig 21
    add_figure_item(
        doc, 21,
        "Prueba 15: Restablecimiento de contraseña utilizando un código de respaldo válido",
        "fig21_p15_restablecer_con_codigo.png",
        "Ejecución de POST /api/auth/restablecer-con-codigo suministrando email, un código válido y la nueva contraseña. "
        "El controlador compara el hash SHA-256 del código, verifica que esté disponible, actualiza la contraseña del usuario, "
        "incrementa version_sesion, marca el código como utilizado y responde exitosamente con HTTP 200 OK."
    )

    # Fig 22
    add_figure_item(
        doc, 22,
        "Prueba 16: Rechazo por intento de reutilización de un código de respaldo ya consumido",
        "fig22_p16_reutilizar_codigo.png",
        "Reenvío del mismo código de respaldo consumido en la prueba anterior hacia el endpoint de restablecimiento. "
        "La base de datos constata que el registro posee fecha_uso no nula, derivando en un rechazo inmediato HTTP 400 Bad Request "
        "('Código de recuperación inválido o ya utilizado'), garantizando la naturaleza desechable (single-use) de los códigos."
    )

    # 3.4 Control de Acceso RBAC y BOLA/IDOR
    add_heading_2(doc, "3.4. Control de Acceso RBAC y Prevención de BOLA/IDOR")

    # Fig 23
    add_figure_item(
        doc, 23,
        "Prueba 17: Consulta autorizada de citas médicas propias en GET /api/citas/mis-citas",
        "fig23_p17_paciente_mis_citas.png",
        "Un usuario con rol 'paciente' autenticado mediante JWT consulta sus citas agendadas en Swagger UI. "
        "El endpoint extrae la identidad del paciente directamente del token verificado y responde HTTP 200 OK "
        "con el conjunto de registros que le corresponden legítimamente, sin requerir identificadores en la URL."
    )

    # Fig 24
    add_figure_item(
        doc, 24,
        "Prueba 18: Bloqueo BOLA/IDOR ante intento de consulta de cita médica ajena",
        "fig24_p18_paciente_cita_ajena.png",
        "El mismo paciente intenta acceder directamente a una cita ajena mediante GET /api/citas/2 manipulando el parámetro de ruta. "
        "El middleware autorizarAccesoCita compara el id del paciente autenticado con el paciente_id de la cita consultada; "
        "al detectar discrepancia, aborta con HTTP 403 Forbidden ('Acceso denegado a esta cita'), neutralizando la vulnerabilidad BOLA."
    )

    # Fig 25
    add_figure_item(
        doc, 25,
        "Prueba 19: Restricción RBAC sobre endpoint administrativo de gestión global de citas",
        "fig25_p19_paciente_citas_admin.png",
        "El paciente intenta invocar GET /api/citas para obtener el listado global de todas las citas del hospital. "
        "El control de roles verifica que la operación requiere privilegios de 'administrador', 'medico' o 'enfermero', "
        "denegando el acceso con código HTTP 403 Forbidden y protegiendo la confidencialidad de la información médica global."
    )

    # 3.5 Desacoplamiento de API Key y JWT
    add_heading_2(doc, "3.5. Desacoplamiento Arquitectónico entre API Key y JWT")

    # Fig 26
    add_figure_item(
        doc, 26,
        "Prueba 20: Denegación de acceso a cliente privado sin cabecera X-API-Key",
        "fig26_p20_cliente_sin_apikey.png",
        "Invocación de GET /api/seguridad/cliente sin adjuntar la credencial de integración en los encabezados HTTP. "
        "El middleware verificarApiKey intercepta la llamada y emite HTTP 401 Unauthorized ('API Key requerida'), "
        "certificando que las interfaces de integración cliente-servidor exigen identificación obligatoria."
    )

    # Fig 27
    add_figure_item(
        doc, 27,
        "Prueba 21: Autorización exitosa de cliente privado con API Key legítima",
        "fig27_p21_cliente_con_apikey.png",
        "Consumo de GET /api/seguridad/cliente incorporando la cabecera X-API-Key con el valor configurado en el sistema. "
        "La API autentica el cliente privado satisfactoriamente, respondiendo HTTP 200 OK y confirmando el rol de servicio "
        "sin requerir la presencia de una sesión interactiva ni tokens JWT de usuario."
    )

    # Fig 28
    add_figure_item(
        doc, 28,
        "Prueba 22: Validación de endpoint público POST /api/auth/login sin exigir API Key",
        "fig28_p22_login_sin_apikey_invalido.png",
        "Petición enviada al endpoint de login sin cabecera X-API-Key y con cuerpo malformado. "
        "La respuesta es HTTP 400 Bad Request (error de validación de campos) y NO 401, evidenciando que el endpoint es público "
        "y que la verificación de API Key ha sido desacoplada de los flujos ordinarios de autenticación de usuarios."
    )

    # Fig 29
    add_figure_item(
        doc, 29,
        "Prueba 23: Validación de ruta de negocio protegida sin credenciales de ningún tipo",
        "fig29_p23_mis_citas_sin_jwt_sin_apikey.png",
        "Solicitud a GET /api/citas/mis-citas sin proporcionar ni JWT ni API Key. "
        "La API rechaza la petición con código HTTP 401 Unauthorized por ausencia de Bearer token, ratificando "
        "que las rutas de negocio dependen estrictamente de la sesión de usuario y no de la clave de integración."
    )

    # Fig 30
    add_figure_item(
        doc, 30,
        "Prueba 24: Acceso exitoso a ruta de negocio con JWT y sin cabecera API Key",
        "fig30_p24_mis_citas_con_jwt_sin_apikey.png",
        "Petición a GET /api/citas/mis-citas portando exclusivamente el token JWT legítimo del paciente (sin X-API-Key). "
        "El endpoint retorna satisfactoriamente HTTP 200 OK, demostrando de manera categórica que las rutas de usuario no están "
        "sobreacopladas a requerir una API Key, corrigiendo la anomalía arquitectónica identificada en fases previas."
    )

    # 3.6 Documentación Swagger
    add_heading_2(doc, "3.6. Auditoría de Esquemas de Seguridad en OpenAPI / Swagger")

    # Fig 31
    add_figure_item(
        doc, 31,
        "Prueba 25: Esquemas de credenciales explícitos (ApiKeyAuth y BearerAuth) en Swagger UI",
        "fig31_p25_swagger_esquemas.png",
        "Apertura del diálogo modal 'Available authorizations' en la documentación interactiva Swagger UI. "
        "Se verifica la coexistencia de ambos esquemas de seguridad documentados: ApiKeyAuth (vía cabecera X-API-Key) y "
        "BearerAuth (HTTP Bearer JWT), con requisitos de seguridad desacoplados y declarados puntualmente por cada operación."
    )

    # -------------------------------------------------------------
    # 4. COMPROBACIONES FINALES Y AUDITORÍA SQL POST-PRUEBAS
    # -------------------------------------------------------------
    add_heading_1(doc, "4. Comprobaciones Finales de Integración y Persistencia (Pasos 9 y 10)")
    add_body_paragraph(
        doc,
        "Para culminar el ciclo de aseguramiento, se ejecutaron pruebas de integración entre sistemas cruzados (CORS) "
        "y se auditó el estado final de las tablas de base de datos tras la batería de pruebas, comprobando la consistencia "
        "de los registros de auditoría y los estados de consumo de credenciales de respaldo."
    )

    # Fig 32
    add_figure_item(
        doc, 32,
        "Prueba 26: Comprobación de CORS Preflight para cliente web frontend (React + Vite)",
        "fig32_p26_cors_preflight.png",
        "Envío de solicitud HTTP OPTIONS desde terminal simulando origen cruzado http://localhost:5173 hacia /api/auth/login. "
        "El servidor responde HTTP 204 No Content incluyendo los encabezados Access-Control-Allow-Origin, Allow-Methods y "
        "Allow-Headers, garantizando que aplicaciones frontend modernas en React/Vite operen sin bloqueos por políticas del navegador."
    )

    # Fig 33
    add_figure_item(
        doc, 33,
        "Auditoría SQL post-pruebas: Estado y consumo de tokens en password_reset_tokens",
        "fig33_bd_tokens_consumidos.png",
        "Consulta directa a la base de datos PostgreSQL tras las pruebas en Swagger. Se certifica que los tokens de recuperación "
        "generados para el usuario de laboratorio registran adecuadamente fecha_uso poblada y estado 'UTILIZADO', garantizando "
        "que ninguna credencial temporal quede activa indefinidamente en el sistema."
    )

    # Fig 34
    add_figure_item(
        doc, 34,
        "Auditoría SQL post-pruebas: Balance y registro de consumo en codigos_recuperacion",
        "fig34_bd_codigos_consumidos.png",
        "Verificación de saldo en codigos_recuperacion para el usuario auditado. El recuento constata la existencia de los 8 "
        "códigos del lote activo, discriminando con exactitud 7 códigos disponibles y 1 código utilizado, validando la precisión "
        "aritmética del motor transaccional ante operaciones concurrentes de recuperación."
    )

    # -------------------------------------------------------------
    # 5. MATRIZ CONSOLIDADA DE RESULTADOS
    # -------------------------------------------------------------
    add_heading_1(doc, "5. Matriz Consolidada de Resultados de Pruebas")
    add_body_paragraph(
        doc,
        "La siguiente tabla consolida los resultados técnicos de las 26 pruebas de integración y seguridad ejecutadas, "
        "contrastando los códigos de estado HTTP esperados frente a las respuestas reales entregadas por el servidor Node.js/Express:"
    )

    pruebas_data = [
        ("P01", "POST /api/auth/login", "Credenciales válidas", "200", "200 OK", "Aprobada", "Emisión correcta de token JWT firmado"),
        ("P02", "POST /api/auth/login", "JSON inválido / malformado", "400", "400 Bad Request", "Aprobada", "Intercepción por validador express-validator"),
        ("P03", "GET /api/auth/perfil", "Sin token JWT", "401", "401 Unauthorized", "Aprobada", "Bloqueo por middleware autenticarJWT"),
        ("P04", "PATCH /api/auth/cambiar-password", "Contraseña actual válida", "200", "200 OK", "Aprobada", "Incremento de version_sesion en base de datos"),
        ("P05", "GET /api/auth/perfil", "JWT revocado (versión 0)", "401", "401 Unauthorized", "Aprobada", "Detección de sesión obsoleta e invalidación"),
        ("P06", "POST /api/auth/login", "Nueva contraseña", "200", "200 OK", "Aprobada", "Autenticación exitosa con nuevo hash bcrypt"),
        ("P07", "PATCH /api/auth/cambiar-password", "Contraseña errónea", "400", "400 Bad Request", "Aprobada", "Rechazo sin alterar versión ni contraseña"),
        ("P08", "POST /api/auth/recuperacion/admin/:id", "Rol Administrador", "200", "200 OK", "Aprobada", "Generación de token temporal de 1 hora"),
        ("P09", "POST /api/auth/restablecer-password", "Token temporal válido", "200", "200 OK", "Aprobada", "Consumo exitoso y actualización de clave"),
        ("P10", "POST /api/auth/restablecer-password", "Token ya consumido", "400", "400 Bad Request", "Aprobada", "Protección contra ataques de repetición"),
        ("P11", "POST /api/auth/recuperacion/admin/:id", "Rol Paciente (No admin)", "403", "403 Forbidden", "Aprobada", "Restricción RBAC de privilegio administrativo"),
        ("P12", "POST /api/auth/codigos-recuperacion", "Usuario autenticado", "201", "201 Created", "Aprobada", "Generación de 8 códigos de respaldo (hashes)"),
        ("P13", "GET /api/auth/codigos/estado", "Usuario autenticado", "200", "200 OK", "Aprobada", "Reporte de balance (8 totales, 8 disponibles)"),
        ("P14", "POST /api/auth/codigos/regenerar", "Usuario autenticado", "200", "200 OK", "Aprobada", "Invalidación de lote previo y nueva emisión"),
        ("P15", "POST /api/auth/restablecer-con-codigo", "Código de respaldo válido", "200", "200 OK", "Aprobada", "Restablecimiento exitoso y consumo de código"),
        ("P16", "POST /api/auth/restablecer-con-codigo", "Código ya consumido", "400", "400 Bad Request", "Aprobada", "Bloqueo por condición de un solo uso"),
        ("P17", "GET /api/citas/mis-citas", "Paciente autenticado", "200", "200 OK", "Aprobada", "Consulta de citas propias mediante identidad JWT"),
        ("P18", "GET /api/citas/:id", "Paciente consulta cita ajena", "403", "403 Forbidden", "Aprobada", "Protección BOLA/IDOR por autorizarAccesoCita"),
        ("P19", "GET /api/citas", "Paciente consulta admin", "403", "403 Forbidden", "Aprobada", "Restricción RBAC por requerir rol administrativo"),
        ("P20", "GET /api/seguridad/cliente", "Sin cabecera X-API-Key", "401", "401 Unauthorized", "Aprobada", "Requerimiento de clave de servicio en endpoint"),
        ("P21", "GET /api/seguridad/cliente", "Con API Key válida", "200", "200 OK", "Aprobada", "Autorización exitosa de cliente de integración"),
        ("P22", "POST /api/auth/login", "Sin API Key (cuerpo malformado)", "400", "400 Bad Request", "Aprobada", "Desacoplamiento: endpoint público no exige API Key"),
        ("P23", "GET /api/citas/mis-citas", "Sin JWT y sin API Key", "401", "401 Unauthorized", "Aprobada", "Exigencia exclusiva de autenticación por JWT"),
        ("P24", "GET /api/citas/mis-citas", "Con JWT y sin API Key", "200", "200 OK", "Aprobada", "Desacoplamiento exitoso entre JWT y API Key"),
        ("P25", "Swagger UI Modal Auth", "N/A (Documentación)", "200", "200 OK", "Aprobada", "Esquemas ApiKeyAuth y BearerAuth declarados"),
        ("P26", "OPTIONS /api/auth/login", "CORS Preflight (Origin: 5173)", "204", "204 No Content", "Aprobada", "Cabeceras de control de acceso cruzado emitidas"),
    ]

    table = doc.add_table(rows=len(pruebas_data) + 1, cols=7)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(0.4), Inches(1.5), Inches(1.3), Inches(0.5), Inches(0.8), Inches(0.7), Inches(1.8)]
    headers = ["#", "Operación / Endpoint", "Escenario / Rol", "Esp.", "Obt.", "Estado", "Observación Técnica"]

    # Estilizar encabezado
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(title)
        run.font.name = "Times New Roman"
        run.font.size = Pt(8.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_shading(hdr_cells[i], "1F4E79")
        set_cell_margins(hdr_cells[i], top=60, bottom=60, left=80, right=80)
        set_cell_border(hdr_cells[i], bottom=dict(sz=6, color="000000"))

    # Estilizar filas de datos
    for row_idx, data in enumerate(pruebas_data):
        row_cells = table.rows[row_idx + 1].cells
        bg_color = "F9FBFD" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx in range(7):
            row_cells[col_idx].width = col_widths[col_idx]
            p = row_cells[col_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.05
            
            # Alineación según columna
            if col_idx in (0, 3, 4, 5):
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                
            run = p.add_run(str(data[col_idx]))
            run.font.name = "Times New Roman"
            run.font.size = Pt(8.0)
            
            if col_idx == 5: # Estado Aprobada
                run.font.bold = True
                run.font.color.rgb = RGBColor(0x1E, 0x84, 0x49) # Verde
                
            set_cell_shading(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], top=40, bottom=40, left=60, right=60)
            set_cell_border(row_cells[col_idx], bottom=dict(sz=2, color="E0E0E0"))

    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(6)

    # -------------------------------------------------------------
    # 6. CONCLUSIÓN TÉCNICA Y ARQUITECTURA DE SEGURIDAD
    # -------------------------------------------------------------
    add_heading_1(doc, "6. Conclusiones Técnicas y Análisis de la Arquitectura de Seguridad")
    add_body_paragraph(
        doc,
        "La auditoría y ejecución de pruebas del Bloque 11 permitieron consolidar una postura de seguridad madura "
        "y coherente en la API Hospital. A través de los ensayos prácticos, se validó la efectividad de los mecanismos "
        "de mitigación frente a las principales amenazas de APIs identificadas en OWASP API Security Top 10, destacando "
        "las siguientes conclusiones de orden arquitectónico:"
    )
    add_body_paragraph(
        doc,
        "1. Desmitificación de RLS frente a conexiones de Backend (BYPASSRLS): Un hallazgo crítico de la auditoría "
        "radica en comprender la naturaleza del motor PostgreSQL en plataformas gestionadas como Supabase. Si bien las 9 tablas "
        "poseen Row Level Security (RLS) habilitado, la cadena de conexión del backend Node.js utiliza el rol postgres, el cual "
        "posee la propiedad nativa rolbypassrls = true. En consecuencia, el motor de base de datos omite cualquier política RLS "
        "en las consultas emitidas por la aplicación. Por tanto, la verdadera y única frontera de seguridad y autorización del sistema "
        "reside estrictamente en el código de Express.js: la validación criptográfica de tokens JWT, el control de sesiones mediante "
        "version_sesion, la verificación de roles (RBAC) y la autorización contextual sobre recursos (BOLA/IDOR). Afirmar que RLS protege "
        "estas operaciones constituiría una falacia de falsa seguridad arquitectónica.",
        bold_prefix="Aislamiento Real vs. RLS: "
    )
    add_body_paragraph(
        doc,
        "2. Eficacia de la Invocación Inmediata de Sesiones: La introducción de version_sesion resolvió de raíz la limitación intrínseca "
        "de los tokens JWT sin estado (stateless). Al persistir un contador entero ligero y contrastarlo en cada solicitud protegida mediante "
        "el middleware autenticarJWT, se logra la revocación inmediata de tokens activos tan pronto como ocurre un cambio de clave o un "
        "restablecimiento administrativo, imposibilitando la persistencia indebida de sesiones vulneradas.",
        bold_prefix="Gestión de Ciclo de Vida JWT: "
    )
    add_body_paragraph(
        doc,
        "3. Segregación Criptográfica de Secretos en Reposo: Los subsistemas de tokens administrativos y códigos de respaldo respetan las "
        "mejores prácticas de almacenamiento seguro al aplicar algoritmos criptográficos unidireccionales (SHA-256). Ni los administradores "
        "ni atacantes con acceso de solo lectura a la base de datos pueden reconstruir los secretos en texto claro, previniendo filtraciones "
        "masivas de credenciales.",
        bold_prefix="Criptografía Unidireccional: "
    )
    add_body_paragraph(
        doc,
        "4. Desacoplamiento Limpio de Credenciales: Se resolvió definitivamente la ambigüedad operativa entre clientes privados y usuarios "
        "finales. La API Key protege exclusivamente integraciones de máquina a máquina o endpoints de infraestructura, mientras que las "
        "rutas funcionales y el flujo de login operan con total independencia de cabeceras de servicio, optimizando el consumo desde "
        "clientes web modernos desacoplados (React / Vite).",
        bold_prefix="Arquitectura de Credenciales: "
    )

    doc.save(DOCX_PATH)
    print(f"\n✅ DOCUMENTO WORD CREADO EXITOSAMENTE EN: {DOCX_PATH}")

if __name__ == "__main__":
    build_informe()

