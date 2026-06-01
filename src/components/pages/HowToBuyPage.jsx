import React, { useMemo, useState } from 'react';
import { trackContact, trackLead } from '../../lib/metaPixel';
import * as ga4 from '../../lib/googleAnalytics';

const WHATSAPP_PHONE = '+54 9 11 2480-0421';
const WHATSAPP_MESSAGE = 'Hola, quiero conocer más sobre Novastone.';
const HOWTOBUY_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-howto-buy-email`;

const HowToBuyPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formState, setFormState] = useState({
    name: '',
    company: '',
    role: 'Marmoleria',
    email: '',
    phone: '',
    cuit: '',
    city: '',
    message: ''
  });

  const whatsAppUrl = useMemo(
    () =>
      `https://wa.me/${WHATSAPP_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(
        WHATSAPP_MESSAGE
      )}`,
    []
  );

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitted || isSubmitting) return;
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const internalSecret = import.meta.env.VITE_INTERNAL_EMAIL_SECRET;
      if (!internalSecret) {
        throw new Error('Configuración incompleta de envío.');
      }

      const payload = {
        name: formState.name,
        company: formState.company,
        role: formState.role,
        email: formState.email,
        phone: formState.phone,
        cuit: formState.cuit,
        city: formState.city,
        message: formState.message
      };

      const response = await fetch(HOWTOBUY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'x-internal-secret': import.meta.env.VITE_INTERNAL_EMAIL_SECRET
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let responseData = {};

      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch {
        responseData = {};
      }

      if (!response.ok || responseData.ok !== true) {
        console.error('HowToBuy submit failed', response.status, responseData || responseText);
        throw new Error(responseData?.error || 'No pudimos enviar tu consulta. Probá de nuevo.');
      }

      trackLead({
        form_name: 'como-comprar',
        trigger_source: 'HowToBuyPage.handleSubmit.success',
      });
      ga4.trackLead({
        form_name: 'como-comprar',
        trigger_source: 'HowToBuyPage.handleSubmit.success',
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('HowToBuy submit failed', error);
      setSubmitError(error?.message || 'No pudimos enviar tu consulta. Probá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="howto-page">
      <div className="howto-hero">
        <h1 className="howto-hero-title">¿Cómo comprar NOVASTONE?</h1>
        <p className="howto-hero-subtitle">
          Novastone es piedra sinterizada ultracompacta para proyectos de
          arquitectura y diseño. Te conectamos con marmolerías asociadas que
          fabrican e instalan tu proyecto.
        </p>
      </div>

      <div className="howto-cards">
        <article className="howto-card">
          <div>
            <h2>Para tu casa o proyecto personal</h2>
            <p>
              Te asesoramos y te conectamos con la marmolería adecuada para
              cotizar, fabricar e instalar.
            </p>
          </div>
          <a
            className="howto-button"
            href={whatsAppUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              trackContact({
                channel: 'whatsapp',
                origin: 'como-comprar',
                page_section: 'particulares',
                trigger_source: 'HowToBuyPage.particulares.whatsapp',
              });
              ga4.trackContact({
                channel: 'whatsapp',
                origin: 'como-comprar',
                page_section: 'particulares',
                trigger_source: 'HowToBuyPage.particulares.whatsapp',
              });
            }}
          >
            Hablar por WhatsApp
          </a>
        </article>

        <article className="howto-card howto-card-form">
          <div>
            <h2>Soy marmolería / arquitecto / constructor</h2>
            <p>
              Accedé a compras mayoristas y soporte técnico. Completá el
              formulario y te contactamos.
            </p>
          </div>
          {isSubmitted ? (
            <p className="howto-success">Gracias. Te contactamos a la brevedad.</p>
          ) : (
            <form className="howto-form" onSubmit={handleSubmit}>
              <div className="howto-form-row">
                <label>
                  Nombre y Apellido
                  <input
                    type="text"
                    value={formState.name}
                    onChange={handleChange('name')}
                    required
                  />
                </label>
                <label>
                  Empresa
                  <input
                    type="text"
                    value={formState.company}
                    onChange={handleChange('company')}
                    required
                  />
                </label>
              </div>
              <div className="howto-form-row">
                <label>
                  Rol
                  <select value={formState.role} onChange={handleChange('role')}>
                    <option value="Marmolería">Marmolería</option>
                    <option value="Arquitecto">Arquitecto</option>
                    <option value="Constructor">Constructor</option>
                    <option value="Desarrollador">Desarrollador</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={formState.email}
                    onChange={handleChange('email')}
                    required
                  />
                </label>
              </div>
              <div className="howto-form-row">
                <label>
                  Teléfono
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={handleChange('phone')}
                    required
                  />
                </label>
                <label>
                  CUIT
                  <input
                    type="text"
                    value={formState.cuit}
                    onChange={handleChange('cuit')}
                    required
                  />
                </label>
              </div>
              <div className="howto-form-row">
                <label>
                  Ciudad / Provincia
                  <input
                    type="text"
                    value={formState.city}
                    onChange={handleChange('city')}
                    required
                  />
                </label>
                <label>
                  Mensaje (opcional)
                  <input
                    type="text"
                    value={formState.message}
                    onChange={handleChange('message')}
                  />
                </label>
              </div>
              <button className="howto-button howto-button-outline" type="submit">
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </button>
              {submitError ? <p className="howto-error">{submitError}</p> : null}
            </form>
          )}
        </article>
      </div>
    </section>
  );
};

export default HowToBuyPage;
