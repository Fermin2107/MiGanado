import { Link } from 'react-router-dom';

function Node({ node, isRoot = false }) {
  if (!node) {
    return (
      <div className="arbol-node vacio">
        Sin datos
      </div>
    );
  }

  const label = node.nombre || node.rp || '—';
  const sub   = node.nombre && node.rp ? node.rp : null;

  if (isRoot) {
    return (
      <div className="arbol-node root">
        {sub && <span className="arbol-node-rp">{sub}</span>}
        <span className="arbol-node-nombre">{label}</span>
        {node.sexo && <span className="arbol-node-sexo">{node.sexo}</span>}
      </div>
    );
  }

  if (node.externo) {
    return (
      <div className="arbol-node externo">
        {sub && <span className="arbol-node-rp">{sub}</span>}
        <span className="arbol-node-nombre">{label}</span>
        {node.sexo && <span className="arbol-node-sexo">{node.sexo}</span>}
      </div>
    );
  }

  return (
    <Link to={`/animales/${node.id}`} className="arbol-node real">
      {sub && <span className="arbol-node-rp">{sub}</span>}
      <span className="arbol-node-nombre">{label}</span>
      {node.sexo && <span className="arbol-node-sexo">{node.sexo}</span>}
    </Link>
  );
}

/*
  Layout (top-down, 4 cols):
  Col 0     Col 1     Col 2     Col 3
  [AP_P]    [AM_P]    [AP_M]    [AM_M]   ← abuelos (row 0)
       ╰───╯              ╰───╯           ← fork connectors (row 1)
       [PADRE]            [MADRE]         ← padres (row 2)
              ╰──────────╯               ← wide connector (row 3)
                  [ANIMAL]               ← animal (row 4, centered)

  AP_P = Abuelo Paterno del Padre  (padre.padre)
  AM_P = Abuelo Materno del Padre  (padre.madre)
  AP_M = Abuelo Paterno de la Madre (madre.padre)
  AM_M = Abuelo Materno de la Madre (madre.madre)
*/

export default function ArbolGenealogico({ animal, padre, madre }) {
  const ap_p = padre?.padre  ?? null;
  const am_p = padre?.madre  ?? null;
  const ap_m = madre?.padre  ?? null;
  const am_m = madre?.madre  ?? null;

  const hasPadre = Boolean(padre);
  const hasMadre = Boolean(madre);
  const hasAbuelos = ap_p || am_p || ap_m || am_m;

  return (
    <div className="arbol-wrapper">
      <div className="arbol-title">Árbol genealógico</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 280 }}>

        {/* Fila 0: abuelos */}
        {hasAbuelos && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 0 }}>
            <Node node={ap_p} />
            <Node node={am_p} />
            <Node node={ap_m} />
            <Node node={am_m} />
          </div>
        )}

        {/* Fila 1: conectores abuelos→padres */}
        {hasAbuelos && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: 20, gap: 6 }}>
            {/* columna 0: rama derecha hacia padre */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
              {(ap_p || am_p) ? <div style={{ flex: 1, borderTop: '2px solid var(--color-border)', borderRight: '2px solid var(--color-border)', height: '100%' }} /> : null}
            </div>
            {/* columna 1: rama izquierda + stem */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(ap_p || am_p) ? (
                <>
                  <div style={{ display: 'flex', flex: 1 }}>
                    <div style={{ flex: 1, borderTop: '2px solid var(--color-border)', borderLeft: '2px solid var(--color-border)' }} />
                  </div>
                  <div style={{ width: 2, background: 'var(--color-border)', height: 0, flex: 0, alignSelf: 'center' }} />
                </>
              ) : null}
            </div>
            {/* columna 2: stem para madre */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {(ap_m || am_m) ? <div style={{ flex: 1, borderTop: '2px solid var(--color-border)', borderRight: '2px solid var(--color-border)', height: '100%' }} /> : null}
            </div>
            {/* columna 3 */}
            <div style={{ display: 'flex' }}>
              {(ap_m || am_m) ? <div style={{ flex: 1, borderTop: '2px solid var(--color-border)', borderLeft: '2px solid var(--color-border)', height: '100%' }} /> : null}
            </div>
          </div>
        )}

        {/* Separador vertical (stem de cada padre) */}
        {hasAbuelos && (hasPadre || hasMadre) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: 8, gap: 6 }}>
            <div />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {hasPadre ? <div style={{ width: 2, background: 'var(--color-border)', height: '100%' }} /> : null}
            </div>
            <div />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {hasMadre ? <div style={{ width: 2, background: 'var(--color-border)', height: '100%' }} /> : null}
            </div>
          </div>
        )}

        {/* Fila 2: padre y madre (cols 1 y 3 de una grid de 4) */}
        {(hasPadre || hasMadre) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 0 }}>
            <div />
            <Node node={padre} />
            <div />
            <Node node={madre} />
          </div>
        )}

        {/* Fila 3: conector ancho padre→animal←madre */}
        {(hasPadre || hasMadre) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: 24, gap: 6 }}>
            <div />
            {/* col 1: barra desde centro-derecha */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '100%', height: '50%',
                borderRight: hasMadre ? '2px solid var(--color-border)' : 'none',
                borderBottom: (hasPadre && hasMadre) ? '2px solid var(--color-border)' : 'none',
              }} />
              <div style={{ flex: 1, alignSelf: 'center', width: 2, background: 'var(--color-border)' }} />
            </div>
            {/* col 2: barra horizontal */}
            <div style={{
              borderBottom: (hasPadre && hasMadre) ? '2px solid var(--color-border)' : 'none',
              height: '50%',
              alignSelf: 'flex-start',
            }} />
            {/* col 3: barra desde izq */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '100%', height: '50%',
                borderLeft: hasPadre ? '2px solid var(--color-border)' : 'none',
                borderBottom: (hasPadre && hasMadre) ? '2px solid var(--color-border)' : 'none',
              }} />
              <div style={{ flex: 1 }} />
            </div>
          </div>
        )}

        {/* Fila 4: animal (centrado) */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 6px' }}>
          <Node node={animal} isRoot />
        </div>

      </div>
    </div>
  );
}
