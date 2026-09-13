const openRolesHtml = 
      <section className=\"mb-20 reveal\">
        <h2 className=\"text-3xl font-heading font-bold text-center uppercase tracking-widest text-white mb-8\">Open Roles in the Next 180 Days</h2>
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
          <div className=\"bg-[#111111] p-6 rounded-xl border border-white/10 shadow-xl\">
            <h3 className=\"text-xl font-bold text-brand-gold uppercase tracking-wider mb-2\">Field Technician</h3>
            <p className=\"text-[#a0a0a0] text-sm mb-4\">Perform scheduled maintenance visits, minor-to-moderate repairs, and respond to 24/7 emergencies.</p>
            <p className=\"text-xs text-white\">Est: $50,000 - $68,000 / year</p>
          </div>
          <div className=\"bg-[#111111] p-6 rounded-xl border border-white/10 shadow-xl\">
            <h3 className=\"text-xl font-bold text-brand-gold uppercase tracking-wider mb-2\">Office Coordinator</h3>
            <p className=\"text-[#a0a0a0] text-sm mb-4\">Manage scheduling, customer communication, dispatch coordination, and administrative support.</p>
            <p className=\"text-xs text-white\">Est: $38,000 - $50,000 / year</p>
          </div>
          <div className=\"bg-[#111111] p-6 rounded-xl border border-white/10 shadow-xl\">
            <h3 className=\"text-xl font-bold text-brand-gold uppercase tracking-wider mb-2\">Maintenance Specialist</h3>
            <p className=\"text-[#a0a0a0] text-sm mb-4\">Focus on recurring subscription visits, routine inspections, tune-ups, and early problem detection.</p>
            <p className=\"text-xs text-white\">Est: $46,000 - $62,000 / year</p>
          </div>
          <div className=\"bg-[#111111] p-6 rounded-xl border border-white/10 shadow-xl\">
            <h3 className=\"text-xl font-bold text-brand-gold uppercase tracking-wider mb-2\">Account Manager</h3>
            <p className=\"text-[#a0a0a0] text-sm mb-4\">Client-facing relationship lead for homeowners, landlords, and investors enrolled in ongoing service plans.</p>
            <p className=\"text-xs text-white\">Est: $48,000 - $70,000 / year</p>
          </div>
          <div className=\"bg-[#111111] p-6 rounded-xl border border-white/10 shadow-xl\">
            <h3 className=\"text-xl font-bold text-brand-gold uppercase tracking-wider mb-2\">Compliance Specialist</h3>
            <p className=\"text-[#a0a0a0] text-sm mb-4\">Ensure every job is logged accurately, creating verified property upkeep histories.</p>
            <p className=\"text-xs text-white\">Est: $42,000 - $58,000 / year</p>
          </div>
          <div className=\"bg-[#111111] p-6 rounded-xl border border-white/10 shadow-xl\">
            <h3 className=\"text-xl font-bold text-brand-gold uppercase tracking-wider mb-2\">Emergency Technician</h3>
            <p className=\"text-[#a0a0a0] text-sm mb-4\">Handle urgent after-hours service calls, stabilizing issues quickly to reduce property damage.</p>
            <p className=\"text-xs text-white\">Est: $52,000 - $72,000 / year</p>
          </div>
        </div>
      </section>
;

const fs = require('fs');
let text = fs.readFileSync('src/pages/Careers.jsx', 'utf8');
text = text.replace('<section className=\"mb-20 reveal\">\\n          <h2 className=\"text-3xl font-heading font-bold text-center uppercase tracking-widest text-white mb-8\">What \\nWe Look For</h2>', openRolesHtml + '\\n        <section className=\"mb-20 reveal\">\\n          <h2 className=\"text-3xl font-heading font-bold text-center uppercase tracking-widest text-white mb-8\">What We Look For</h2>');
fs.writeFileSync('src/pages/Careers.jsx', text);
