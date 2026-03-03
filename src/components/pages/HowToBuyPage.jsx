import React, { useMemo, useState } from 'react';

const WHATSAPP_PHONE = '+54 9 11 2480-0421';
const WHATSAPP_MESSAGE = 'Hola, quiero conocer más sobre Novastone.';
const CONTACT_EMAIL = 'nova.grupoarg@gmail.com';

const HowToBuyPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitted) return;

    const params = new URLSearchParams({
      subject: 'Solicitud mayorista Novastone',
      body: [
        `Nombre y Apellido: ${formState.name}`,
        `Empresa: ${formState.company}`,
        `Rol: ${formState.role}`,
        `Email: ${formState.email}`,
        `Teléfono: ${formState.phone || '-'}`,
        `CUIT: ${formState.cuit}`,
        `Ciudad / Provincia: ${formState.city}`,
        `Mensaje: ${formState.message || '-'}`
      ].join('\n')
    });

    window.location.href = `mailto:${CONTACT_EMAIL}?${params.toString()}`;
    setIsSubmitted(true);
  };

  return (
    <section className="howto-page">
      <div className="howto-hero">
        <h1 className="howto-hero-title">¿Cómo comprar NOVASTONE?</h1>
        <p className="howto-hero-subtitle">
          Novastone es la marca. Para diseñar tu espacio, te conectamos con
          marmolerías asociadas que fabrican e instalan tu proyecto.
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
          <a className="howto-button" href={whatsAppUrl} target="_blank" rel="noreferrer">
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
                  Teléfono (opcional)
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={handleChange('phone')}
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
                Enviar
              </button>
            </form>
          )}
        </article>
      </div>
    </section>
  );
};

export default HowToBuyPage;
