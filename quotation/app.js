/* EAJ quotation values are centralized here so pricing can be updated after confirmation. */
const PRICE = {
  monthly: 3499,
  annual: 29988,
  oneTimeEstimate: 85000,
  faceMonthlyEstimate: 999,
  faceAnnualEstimate: 9990,
  faceOneTimeEstimate: 12000,
};
const state = { mode: 'subscription', billing: 'monthly', properties: 1, face: false };
const peso = value => '₱' + Math.round(value).toLocaleString('en-PH');
const $ = selector => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const validInteger = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 20;

if (params.get('mode') === 'one-time') state.mode = 'one-time';
if (params.get('billing') === 'annual') state.billing = 'annual';
if (validInteger(params.get('properties'))) state.properties = Number(params.get('properties'));
state.face = params.get('face') === '1';

function quote() {
  const base = state.mode === 'one-time' ? PRICE.oneTimeEstimate : PRICE[state.billing];
  const addon = !state.face ? 0 : state.mode === 'one-time' ? PRICE.faceOneTimeEstimate : state.billing === 'annual' ? PRICE.faceAnnualEstimate : PRICE.faceMonthlyEstimate;
  return { base, addon, unit: base + addon, total: (base + addon) * state.properties };
}

function terms() {
  if (state.mode === 'one-time') return [
    ['Estimated price', 'The displayed implementation and face login fees are planning estimates. EAJ will confirm the final scope, hardware, integration effort and price in a signed proposal.'],
    ['Payment schedule', 'The estimated total is split 50% upon project start and 50% on acceptance or go-live, subject to the final agreement.'],
    ['Hosting & maintenance', 'Cloud hosting, domain, backups, security updates and ongoing support are quoted separately after handover.'],
    ['Ownership & delivery', 'Deployment and usage rights, source access, timeline and acceptance criteria are set out in the final service agreement.'],
  ];
  return [
    ['Billing', state.billing === 'annual' ? 'The plan is billed annually in advance per property. Add-on fees follow the same billing period.' : 'The plan is billed monthly in advance per property. Add-on fees follow the same billing period.'],
    ['Included operations', 'Hosting, SSL, routine platform updates and backups are included in the hosted subscription.'],
    ['Third-party fees', 'Payment processing, SMS, domain registration and other external provider charges are separate.'],
    ['Scope & activation', 'EAJ confirms onboarding, support level, launch schedule and service terms before activation.'],
  ];
}

function render() {
  const q = quote();
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.toggle('is-selected', card.dataset.mode === state.mode);
    card.querySelector('input').checked = card.dataset.mode === state.mode;
  });
  document.querySelector(`input[name="billing"][value="${state.billing}"]`).checked = true;
  $('#subscription-controls').hidden = state.mode === 'one-time';
  $('#face-addon').checked = state.face;
  $('.addon').classList.toggle('is-active', state.face);
  $('#addon-price').textContent = state.mode === 'one-time' ? `+ Est. ${peso(PRICE.faceOneTimeEstimate)} / property` : state.billing === 'annual' ? `+ Est. ${peso(PRICE.faceAnnualEstimate)} / year` : `+ Est. ${peso(PRICE.faceMonthlyEstimate)} / month`;
  $('#properties').value = state.properties;
  $('#minus').disabled = state.properties === 1;
  $('#plus').disabled = state.properties === 20;
  const baseName = state.mode === 'one-time' ? 'One-time platform estimate' : state.billing === 'annual' ? 'Annual platform subscription' : 'Monthly platform subscription';
  const suffix = state.mode === 'one-time' ? 'one time' : state.billing === 'annual' ? 'per year' : 'per month';
  $('#line-items').innerHTML = `<div class="line-item"><span>${baseName} × ${state.properties}</span><span>${peso(q.base * state.properties)}</span></div>` + (state.face ? `<div class="line-item"><span>Face recognition login × ${state.properties}</span><span>${peso(q.addon * state.properties)}</span></div>` : '<div class="line-item"><span>Face recognition login</span><span>Not selected</span></div>');
  $('#total-label').textContent = state.mode === 'one-time' ? 'Estimated one-time total' : state.billing === 'annual' ? 'Total due annually' : 'Total due monthly';
  $('#total').textContent = peso(q.total);
  $('#total-note').textContent = state.mode === 'one-time' ? `Estimated fee for ${state.properties} ${state.properties === 1 ? 'property' : 'properties'}; hosting and maintenance separate.` : `Billed ${state.billing} in advance for ${state.properties} ${state.properties === 1 ? 'property' : 'properties'}.`;
  $('#payment-split').innerHTML = state.mode === 'one-time' ? `<div><span>Estimated 50% to begin</span><b>${peso(Math.round(q.total / 2))}</b></div><div><span>Estimated 50% at acceptance</span><b>${peso(q.total - Math.round(q.total / 2))}</b></div>` : state.billing === 'annual' ? `<div><span>Monthly equivalent</span><b>${peso(q.total / 12)} / mo</b></div><div><span>Base plan savings vs monthly</span><b>${peso((PRICE.monthly * 12 - PRICE.annual) * state.properties)} / yr</b></div>` : '';
  $('#estimate-note').textContent = state.mode === 'one-time' ? 'This is an estimate, not a fixed offer. EAJ must approve final one-time pricing and project scope.' : state.face ? 'Face recognition login price is estimated pending implementation review.' : '';
  $('#terms').innerHTML = terms().map(([heading, body]) => `<div class="term"><strong>${heading}</strong><p>${body}</p></div>`).join('');
  const next = new URL(location.href);
  next.searchParams.set('mode', state.mode);
  next.searchParams.set('properties', state.properties);
  if (state.mode === 'subscription') next.searchParams.set('billing', state.billing); else next.searchParams.delete('billing');
  if (state.face) next.searchParams.set('face', '1'); else next.searchParams.delete('face');
  history.replaceState(null, '', next);
}

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', () => { state.mode = input.value; render(); }));
document.querySelectorAll('input[name="billing"]').forEach(input => input.addEventListener('change', () => { state.billing = input.value; render(); }));
$('#face-addon').addEventListener('change', event => { state.face = event.target.checked; render(); });
$('#minus').addEventListener('click', () => { state.properties = Math.max(1, state.properties - 1); render(); });
$('#plus').addEventListener('click', () => { state.properties = Math.min(20, state.properties + 1); render(); });
$('#properties').addEventListener('change', event => { state.properties = Math.max(1, Math.min(20, parseInt(event.target.value, 10) || 1)); render(); });
$('#print').addEventListener('click', () => window.print());
$('#copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); notify('Selection link copied'); } catch { window.prompt('Copy this link', location.href); } });
render();
