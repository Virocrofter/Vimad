/* Vimad Booking Widget — embeddable availability + booking funnel (E2x).
 * Drop on any hotel website:
 *   <div id="vimad-booking"></div>
 *   <script src="https://<your-app-host>/vimad-booking.js"
 *           data-property="PROP-CODE" data-api="https://<api-host>" defer></script>
 * or programmatically:
 *   VimadBooking.init({ property: 'PROP-CODE', element: '#vimad-booking', api: 'https://<api-host>' });
 * Notes:
 * - api defaults to same-origin '/v1' (use when a reverse proxy maps /v1 -> API).
 * - Every mount generates ONE Idempotency-Key; double-submit replays the
 *   stored response instead of booking twice (server-side, P4b-proven).
 * - Response shapes are read defensively; see console.debug for raw payloads.
 */
(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  var toISO = function (d) {
    return d.toISOString().slice(0, 10);
  };
  var idemKey =
    window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : 'w-' + Date.now() + '-' + Math.random().toString(36).slice(2);

  function Widget(cfg) {
    this.code = cfg.property;
    this.api = (cfg.api || '/v1').replace(/\/$/, '');
    this.el =
      typeof cfg.element === 'string'
        ? document.querySelector(cfg.element)
        : cfg.element || document.getElementById('vimad-booking');
    if (!this.el) {
      this.el = document.createElement('div');
      document.body.appendChild(this.el);
    }
    this.renderSearch();
  }

  Widget.prototype.req = function (method, path, body) {
    var headers = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (method === 'POST') headers['Idempotency-Key'] = idemKey;
    return fetch(this.api + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (json) {
          if (!res.ok)
            throw new Error(
              (json.error && json.error.message) || 'Request failed (' + res.status + ')'
            );
          return json.data !== undefined ? json.data : json;
        });
    });
  };

  Widget.prototype.renderSearch = function () {
    var self = this;
    var today = toISO(new Date());
    var tom = toISO(new Date(Date.now() + 86400000));
    this.el.innerHTML =
      '<div class="vmb" style="max-width:420px;font-family:system-ui,sans-serif;color:#132B3A">' +
      '  <div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '    <label style="flex:1;min-width:120px;font-size:12px">Check-in<br><input data-vmb="in" type="date" value="' +
      today +
      '" style="width:100%;padding:6px;border:1px solid #cbd5d1;border-radius:6px"></label>' +
      '    <label style="flex:1;min-width:120px;font-size:12px">Check-out<br><input data-vmb="out" type="date" value="' +
      tom +
      '" style="width:100%;padding:6px;border:1px solid #cbd5d1;border-radius:6px"></label>' +
      '  </div>' +
      '  <div style="display:flex;gap:8px;margin-top:8px">' +
      '    <label style="font-size:12px">Adults<br><select data-vmb="adults" style="padding:6px;border:1px solid #cbd5d1;border-radius:6px"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></label>' +
      '    <label style="font-size:12px">Children<br><select data-vmb="children" style="padding:6px;border:1px solid #cbd5d1;border-radius:6px"><option selected>0</option><option>1</option><option>2</option></select></label>' +
      '    <button data-vmb="go" style="align-self:flex-end;padding:8px 16px;background:#1F7A78;color:#fff;border:0;border-radius:6px;cursor:pointer">Check availability</button>' +
      '  </div>' +
      '  <div data-vmb="msg" style="margin-top:10px;font-size:13px;color:#B42318"></div>' +
      '  <div data-vmb="results" style="margin-top:12px"></div>' +
      '</div>';
    this.el.querySelector('[data-vmb=go]').onclick = function () {
      self.search();
    };
  };

  Widget.prototype.search = function () {
    var self = this;
    var q = function (k) {
      return self.el.querySelector('[data-vmb=' + k + ']').value;
    };
    var msg = this.el.querySelector('[data-vmb=msg]');
    var out = this.el.querySelector('[data-vmb=results]');
    msg.textContent = '';
    out.innerHTML = '<p style="font-size:13px;color:#666">Checking availability…</p>';
    this.req(
      'GET',
      '/v1/public/properties/' +
        encodeURIComponent(this.code) +
        '/availability?checkIn=' +
        q('in') +
        '&checkOut=' +
        q('out') +
        '&adults=' +
        q('adults') +
        '&children=' +
        q('children')
    )
      .then(function (data) {
        console.debug('[vimad-widget] availability', data);
        var rooms = data.roomTypes || data.results || (Array.isArray(data) ? data : []);
        if (!rooms.length) {
          out.innerHTML = '<p style="font-size:13px">No rooms available for those dates.</p>';
          return;
        }
        out.innerHTML = rooms
          .map(function (r, i) {
            var id = r.roomTypeId || r.id;
            var rate = r.total ?? r.rate ?? r.price ?? r.nightlyRate;
            return (
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px">' +
              '<div><strong style="font-size:14px">' +
              esc(r.name) +
              '</strong>' +
              (rate != null
                ? '<div style="font-size:12px;color:#666">' + esc(rate) + '</div>'
                : '') +
              '</div>' +
              '<button data-vmb="book-' +
              i +
              '" data-id="' +
              esc(id) +
              '" style="padding:6px 14px;background:#1F7A78;color:#fff;border:0;border-radius:6px;cursor:pointer">Book</button></div>'
            );
          })
          .join('');
        rooms.forEach(function (r, i) {
          out.querySelector('[data-vmb=book-' + i + ']').onclick = function () {
            self.selected = { roomTypeId: this.getAttribute('data-id'), name: r.name };
            self.renderForm(q('in'), q('out'), q('adults'), q('children'));
          };
        });
      })
      .catch(function (e) {
        out.innerHTML = '';
        msg.textContent = e.message;
      });
  };

  Widget.prototype.renderForm = function (checkIn, checkOut, adults, children) {
    var self = this;
    this.el.querySelector('[data-vmb=results]').innerHTML =
      '<p style="font-size:13px;margin-bottom:8px">Booking: <strong>' +
      esc(this.selected.name) +
      '</strong></p>' +
      '<div style="display:grid;gap:8px">' +
      '<input data-vmb="fn" placeholder="First name" style="padding:8px;border:1px solid #cbd5d1;border-radius:6px">' +
      '<input data-vmb="ln" placeholder="Last name" style="padding:8px;border:1px solid #cbd5d1;border-radius:6px">' +
      '<input data-vmb="em" type="email" placeholder="Email" style="padding:8px;border:1px solid #cbd5d1;border-radius:6px">' +
      '<input data-vmb="ph" placeholder="Phone" style="padding:8px;border:1px solid #cbd5d1;border-radius:6px">' +
      '<button data-vmb="pay" style="padding:10px;background:#1F7A78;color:#fff;border:0;border-radius:6px;cursor:pointer">Continue to payment</button>' +
      '</div>';
    this.el.querySelector('[data-vmb=pay]').onclick = function () {
      var v = function (k) {
        return self.el.querySelector('[data-vmb=' + k + ']').value.trim();
      };
      var msg = self.el.querySelector('[data-vmb=msg]');
      msg.textContent = '';
      self
        .req('POST', '/v1/public/properties/' + encodeURIComponent(self.code) + '/bookings', {
          checkIn: checkIn,
          checkOut: checkOut,
          adults: Number(adults),
          children: Number(children),
          roomTypeId: self.selected.roomTypeId,
          guest: { firstName: v('fn'), lastName: v('ln'), email: v('em'), phone: v('ph') },
        })
        .then(function (data) {
          console.debug('[vimad-widget] booking', data);
          var url =
            data.authorization_url ||
            (data.payment && data.payment.authorization_url) ||
            (data.deposit && data.deposit.authorization_url) ||
            (data.data && data.data.authorization_url);
          self.el.querySelector('[data-vmb=results]').innerHTML =
            '<p style="font-size:14px;color:#1F7A78"><strong>Booking received!</strong></p>' +
            (url
              ? '<p style="font-size:13px;margin-top:8px"><a href="' +
                esc(url) +
                '" style="color:#1F7A78">Complete your deposit payment</a></p>'
              : '<p style="font-size:13px;margin-top:8px">Check your email for confirmation.</p>');
        })
        .catch(function (e) {
          msg.textContent = e.message;
        });
    };
  };

  window.VimadBooking = {
    init: function (cfg) {
      if (!cfg || !cfg.property) throw new Error('VimadBooking.init({ property }) is required');
      return new Widget(cfg);
    },
  };

  // Auto-init from data-* attributes when the script tag carries them.
  var tag = document.currentScript;
  if (tag && tag.getAttribute('data-property')) {
    var boot = function () {
      window.VimadBooking.init({
        property: tag.getAttribute('data-property'),
        api: tag.getAttribute('data-api') || undefined,
        element: tag.getAttribute('data-element') || undefined,
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})();
