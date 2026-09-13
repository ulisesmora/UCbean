/**
 * El sobre en el que viaja cada correo.
 *
 * Un correo no es una página web. Gmail borra el `<style>`, Outlook ignora
 * flexbox y la mitad de los clientes no cargan las fuentes, así que todo va
 * en atributos `style` sobre una tabla, que es lo único que interpretan
 * todos igual desde hace veinte años.
 *
 * El texto plano se sigue mandando siempre: es lo que ve quien bloquea el
 * HTML, y es lo que evita que el correo acabe en spam por venir solo con
 * imágenes y marcado.
 */

/** Los mismos colores del sitio, escritos aquí porque un correo no carga CSS. */
const OLIVA = '#A9C23F';
const OLIVA_OSCURO = '#55681A';
const TINTA = '#111110';
const GRIS = '#57574F';
const PAPEL = '#F7F7F4';

/** Escapa el texto que entra, por si un nombre trae un signo de menor que. */
function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convierte el cuerpo en párrafos y saca el enlace a un botón.
 *
 * Las plantillas se escriben en texto plano, con una URL suelta en su
 * propia línea. Aquí esa línea se vuelve el botón, que es lo que la gente
 * busca al abrir un correo de verificación.
 */
export function renderEmail(title: string, body: string): string {
  const lineas = body.split('\n');
  const urlIndex = lineas.findIndex((l) => /^https?:\/\/\S+$/.test(l.trim()));
  const url = urlIndex >= 0 ? lineas[urlIndex].trim() : null;

  const parrafos = lineas
    .filter((_, i) => i !== urlIndex)
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${GRIS};">` +
        `${escape(p).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');

  const boton = url
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
         <tr><td style="border-radius:10px;background:${OLIVA};">
           <a href="${escape(url)}"
              style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;
                     color:${TINTA};text-decoration:none;border-radius:10px;">
             ${escape(title)}
           </a>
         </td></tr>
       </table>
       <p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#8A8A82;">
         Si el botón no funciona, copia esta dirección:<br>
         <span style="color:${OLIVA_OSCURO};word-break:break-all;">${escape(url)}</span>
       </p>`
    : '';

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPEL};">
  <!-- El preheader es lo que se lee en la bandeja debajo del asunto.
       Oculto en el cuerpo, visible en la lista de correos. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escape(body.split('\n')[0] ?? '')}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:${PAPEL};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:520px;background:#FFFFFF;border-radius:16px;
                    border:1px solid #EAEAE4;">
        <tr><td style="padding:28px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:8px;">
                <div style="width:10px;height:10px;border-radius:10px;background:${OLIVA};"></div>
              </td>
              <td style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:${TINTA};">
                Around the Bean
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 28px 28px;
                       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:${TINTA};">
            ${escape(title)}
          </h1>
          ${parrafos}
          ${boton}
        </td></tr>

        <tr><td style="padding:0 28px 28px;border-top:1px solid #EAEAE4;">
          <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8A8A82;">
            Around the Bean · UBC Vancouver<br>
            Este correo es sobre tu cuenta o tu pedido.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
