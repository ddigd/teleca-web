# This script patches the Nav function in SiteClient.tsx
# to move Globe icon to far-right with hover dropdown

import sys

filepath = sys.argv[1] if len(sys.argv) > 1 else "teleca-web/components/SiteClient.tsx"

with open(filepath) as f:
    code = f.read()

# Find Nav function boundaries
nav_start = code.find("function Nav() {")
# Find the next top-level function after Nav
nav_end = code.find("\nfunction Footer()")
if nav_end == -1:
    nav_end = code.find("\nfunction ", nav_start + 20)

old_nav = code[nav_start:nav_end]
print(f"Found Nav at chars {nav_start}-{nav_end}, length {len(old_nav)}")

new_nav = '''function Nav() {
  const { page, setPage } = useContext(Ctx) || {};
  const { mob } = useR();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ctx = useContext(Ctx);
  const navLang = ctx?.lang || "en";
  const navToggle = ctx?.toggleLang;
  const links = [{ key: "home", label: t("nav.home", navLang) }, { key: "collection", label: t("nav.collection", navLang) }, { key: "contact", label: t("nav.contact", navLang) }];

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: mob ? "0 16px" : "0 32px", height: 56, background: C.black, position: "sticky", top: 0, zIndex: 100 }}>
      {/* Left: Logo + Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: mob ? 12 : 24 }}>
        <img src={LOGO_SRC} alt="TELECA" onClick={() => setPage({ view: "home" })} style={{ height: mob ? 22 : 28, cursor: "pointer" }} />
        {!mob && links.map(l => (
          <button key={l.key} onClick={() => setPage({ view: l.key })} style={{ fontFamily: F.ui, color: page?.view === l.key ? C.white : C.textLight, fontSize: 13, fontWeight: 700, letterSpacing: ".06em", cursor: "pointer", textTransform: "uppercase", border: "none", background: "none", borderBottom: page?.view === l.key ? "2px solid white" : "2px solid transparent", padding: "4px 0" }}>{l.label}</button>
        ))}
      </div>

      {/* Right: Globe + Hamburger */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Globe language dropdown */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => !mob && setLangOpen(true)}
          onMouseLeave={() => !mob && setLangOpen(false)}
        >
          <button
            onClick={() => mob ? setLangOpen(!langOpen) : undefined}
            style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", padding: 6, display: "flex", alignItems: "center", transition: "color .2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.textLight)}
          >
            <Globe size={18} />
          </button>
          {langOpen && (
            <div style={{
              position: "absolute", top: "100%", right: 0,
              background: C.black, border: `1px solid ${C.gray800}`,
              minWidth: 120, zIndex: 200,
              boxShadow: "0 4px 12px rgba(0,0,0,.5)"
            }}>
              {[
                { code: "en", label: "English" },
                { code: "ko", label: "한국어" },
              ].map(opt => (
                <button
                  key={opt.code}
                  onClick={() => {
                    if (navLang !== opt.code && navToggle) navToggle();
                    setLangOpen(false);
                  }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "10px 16px", border: "none", cursor: "pointer",
                    background: navLang === opt.code ? C.gray800 : "transparent",
                    color: navLang === opt.code ? C.white : C.textLight,
                    fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                    transition: "background .15s, color .15s"
                  }}
                  onMouseEnter={(e) => { if (navLang !== opt.code) { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.color = C.white; }}}
                  onMouseLeave={(e) => { if (navLang !== opt.code) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textLight; }}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {mob && <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: C.white, cursor: "pointer" }}><Menu size={20} /></button>}
      </div>

      {/* Mobile menu */}
      {mob && open && (
        <div style={{ position: "absolute", top: 56, left: 0, right: 0, background: C.black, zIndex: 99 }}>
          {links.map(l => (
            <button key={l.key} onClick={() => { setPage({ view: l.key }); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", color: C.white, fontSize: 14, fontWeight: 700, padding: "14px 16px", border: "none", background: page?.view === l.key ? C.gray800 : "transparent", cursor: "pointer", borderBottom: `1px solid ${C.gray800}` }}>{l.label}</button>
          ))}
        </div>
      )}
    </nav>
  );
}
'''

code = code[:nav_start] + new_nav + code[nav_end:]

with open(filepath, "w") as f:
    f.write(code)

print(f"Nav patched successfully. Total lines: {len(code.splitlines())}")
