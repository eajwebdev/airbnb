/* Edit the monthly prices below when EAJ confirms its final rate card. */
const PRICING = {
  base: 1799,
  websites: { none: 0, business: 499, booking: 999 },
  addons: [
    { id: 'pos', name: 'Point of sale', price: 499, description: 'Front desk sales, items, charges and transaction records.' },
    { id: 'cleaning', name: 'Cleaning & staff tasks', price: 299, description: 'Room turnover tasks, assignments, status updates and task photos.' },
    { id: 'promotions', name: 'Promos & seasonal rates', price: 249, description: 'Date-based rates, discount codes and add-on offers.' },
    { id: 'messages', name: 'Guest messaging', price: 299, description: 'Message templates and booking communication tools. Delivery-provider fees are separate.' },
    { id: 'reports', name: 'Advanced reports & insights', price: 349, description: 'Expanded booking, revenue and operations views.' },
    { id: 'payments', name: 'Online payment integration', price: 399, description: 'Connect a supported payment provider to booking checkout. Requires the Booking Website add-on; provider fees are separate.', requires: 'booking' },
    { id: 'face', name: 'Face recognition login', price: 999, description: 'Camera-based staff sign-in with enrollment, recovery and a password fallback. Subject to biometric privacy review.' },
  ],
};

const $ = selector => document.querySelector(selector);
const peso = value => '₱' + Math.round(value).toLocaleString('en-PH');
const params = new URLSearchParams(location.search);
const addonIds = new Set(PRICING.addons.map(addon => addon.id));
const requestedAddons = (params.get('addons') || '').split(',').filter(id => addonIds.has(id));
const state = {
  properties: Math.max(1, Math.min(20, parseInt(params.get('properties'), 10) || 1)),
  website: Object.hasOwn(PRICING.websites, params.get('website')) ? params.get('website') : 'none',
  addons: new Set(requestedAddons),
};
if (params.get('face') === '1') state.addons.add('face'); // Legacy shared links.
if (state.website !== 'booking') state.addons.delete('payments');

function drawAddons() {
  $('#addons').innerHTML = PRICING.addons.map(addon => `<label class="addon" data-addon="${addon.id}"><input type="checkbox" value="${addon.id}"><span class="addon-toggle" aria-hidden="true"></span><span class="addon-copy"><strong>${addon.name}</strong><small>${addon.description}</small></span><span class="addon-price">+ ${peso(addon.price)} / mo</span></label>`).join('');
  $('#addons').addEventListener('change', event => {
    const id = event.target.value;
    if (!addonIds.has(id)) return;
    if (event.target.checked) state.addons.add(id); else state.addons.delete(id);
    render();
  });
}

function calculate() {
  const chosen = PRICING.addons.filter(addon => state.addons.has(addon.id));
  const perProperty = PRICING.base + PRICING.websites[state.website] + chosen.reduce((sum, addon) => sum + addon.price, 0);
  return { chosen, perProperty, total: perProperty * state.properties };
}

function render() {
  if (state.website !== 'booking') state.addons.delete('payments');
  document.querySelectorAll('.website-card').forEach(card => {
    const selected = card.dataset.website === state.website;
    card.classList.toggle('is-selected', selected);
    card.querySelector('input').checked = selected;
  });
  document.querySelectorAll('.addon').forEach(row => {
    const addon = PRICING.addons.find(item => item.id === row.dataset.addon);
    const blocked = !!addon.requires && state.website !== addon.requires;
    const input = row.querySelector('input');
    input.checked = state.addons.has(addon.id);
    input.disabled = blocked;
    row.classList.toggle('is-active', input.checked);
    row.classList.toggle('is-disabled', blocked);
  });

  $('#properties').value = state.properties;
  $('#minus').disabled = state.properties === 1;
  $('#plus').disabled = state.properties === 20;
  const q = calculate();
  const websiteNames = { business: 'Business landing page', booking: 'Booking website + customer accounts' };
  const rows = [{ name: 'Booking Core', price: PRICING.base }];
  if (state.website !== 'none') rows.push({ name: websiteNames[state.website], price: PRICING.websites[state.website] });
  q.chosen.forEach(addon => rows.push({ name: addon.name, price: addon.price }));
  $('#line-items').innerHTML = rows.map(row => `<div class="line-item"><span>${row.name} × ${state.properties}</span><span>${peso(row.price * state.properties)}</span></div>`).join('');
  $('#total').textContent = peso(q.total);
  $('#total-note').textContent = `${peso(q.perProperty)} per property, billed monthly in advance for ${state.properties} ${state.properties === 1 ? 'property' : 'properties'}.`;
  $('#terms').innerHTML = [
    ['Monthly billing', 'The base plan and selected add-ons are billed monthly in advance per property.'],
    ['Included hosting', 'Cloud hosting, SSL, routine platform updates and backups are part of the base subscription.'],
    ['Add-on prices', 'Displayed add-on rates are planning prices. EAJ will confirm scope and final pricing before activation.'],
    ['External fees', 'Payment processing, SMS or email delivery, domain registration and other third-party charges are separate.'],
    ['Account & data', 'Customer accounts are included only with the Booking Website add-on. Access, retention and privacy terms are agreed before launch.'],
    ['Activation', 'Onboarding, support level and launch schedule are confirmed in the final service agreement.'],
  ].map(([title, body]) => `<div class="term"><strong>${title}</strong><p>${body}</p></div>`).join('');

  const next = new URL(location.href);
  ['mode', 'billing', 'face'].forEach(key => next.searchParams.delete(key));
  next.searchParams.set('properties', String(state.properties));
  if (state.website === 'none') next.searchParams.delete('website'); else next.searchParams.set('website', state.website);
  if (state.addons.size) next.searchParams.set('addons', PRICING.addons.filter(addon => state.addons.has(addon.id)).map(addon => addon.id).join(','));
  else next.searchParams.delete('addons');
  history.replaceState(null, '', next);
}

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

drawAddons();
document.querySelectorAll('input[name="website"]').forEach(input => input.addEventListener('change', () => { state.website = input.value; render(); }));
$('#minus').addEventListener('click', () => { state.properties = Math.max(1, state.properties - 1); render(); });
$('#plus').addEventListener('click', () => { state.properties = Math.min(20, state.properties + 1); render(); });
$('#properties').addEventListener('change', event => { state.properties = Math.max(1, Math.min(20, parseInt(event.target.value, 10) || 1)); render(); });
$('#print').addEventListener('click', () => window.print());
$('#copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); notify('Selection link copied'); } catch { window.prompt('Copy this link', location.href); } });
render();
