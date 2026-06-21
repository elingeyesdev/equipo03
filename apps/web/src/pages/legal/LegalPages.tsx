import React from 'react';
import { Link } from 'react-router-dom';

const Shell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#0B0F19] text-white font-sans">
    <nav className="border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-extrabold tracking-tight">
          <span className="text-white">GymSync</span>
          <span className="text-orange-500"> Suite</span>
        </Link>
        <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Volver al inicio</Link>
      </div>
    </nav>
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">{title}</h1>
      <div className="text-gray-400 text-sm leading-relaxed space-y-6">{children}</div>
    </main>
    <footer className="border-t border-white/5 py-6 px-6 text-center text-gray-600 text-xs">
      © {new Date().getFullYear()} GymSync Suite — UNIVALLE
    </footer>
  </div>
);

export const TerminosPage = () => (
  <Shell title="Términos de Uso">
    <p>Última actualización: {new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <h2 className="text-white text-lg font-bold mt-8">1. Aceptación de los Términos</h2>
    <p>Al acceder y utilizar GymSync Suite, aceptas estar sujeto a estos términos de uso. Si no estás de acuerdo con alguno de estos términos, no deberías utilizar el servicio.</p>
    <h2 className="text-white text-lg font-bold mt-8">2. Descripción del Servicio</h2>
    <p>GymSync Suite es una plataforma de gestión integral para cadenas de gimnasios que incluye un panel web administrativo y una aplicación móvil nativa. El servicio permite la gestión de sucursales, usuarios, reservas, rutinas de entrenamiento, planes nutricionales y más.</p>
    <h2 className="text-white text-lg font-bold mt-8">3. Cuentas de Usuario</h2>
    <p>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Aceptas notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.</p>
    <h2 className="text-white text-lg font-bold mt-8">4. Uso Aceptable</h2>
    <p>Te comprometes a utilizar el servicio solo para fines legítimos relacionados con la gestión de establecimientos deportivos. Queda prohibido cualquier uso que viole leyes aplicables o que interfiera con el funcionamiento del servicio.</p>
    <h2 className="text-white text-lg font-bold mt-8">5. Propiedad Intelectual</h2>
    <p>Este proyecto fue desarrollado como trabajo académico en la Universidad Privada del Valle (UNIVALLE) por Rene Aaron Sendoya Baqueros y Sebastian Fernandez Conde. Todos los derechos sobre el código fuente y diseño pertenecen a sus autores.</p>
    <h2 className="text-white text-lg font-bold mt-8">6. Limitación de Responsabilidad</h2>
    <p>GymSync Suite se proporciona "tal cual" sin garantías de ningún tipo. No nos hacemos responsables de daños directos o indirectos derivados del uso del servicio.</p>
  </Shell>
);

export const PrivacidadPage = () => (
  <Shell title="Política de Privacidad">
    <p>Última actualización: {new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <h2 className="text-white text-lg font-bold mt-8">1. Información que Recopilamos</h2>
    <p>Recopilamos la información que proporcionas al registrarte: nombre, correo electrónico, teléfono y datos de perfil. Para la funcionalidad de geolocalización, recopilamos datos de ubicación GPS con tu consentimiento explícito.</p>
    <h2 className="text-white text-lg font-bold mt-8">2. Uso de la Información</h2>
    <p>Utilizamos tus datos para: gestionar tu cuenta, procesar reservas, asignar rutinas y planes nutricionales, detectar tu ubicación para check-in automático por GPS, y enviarte notificaciones push relevantes.</p>
    <h2 className="text-white text-lg font-bold mt-8">3. Almacenamiento y Seguridad</h2>
    <p>Los datos se almacenan en servidores PostgreSQL con conexiones cifradas. Las contraseñas se hashean con bcrypt. Las sesiones utilizan JWT con expiración automática. Las imágenes se almacenan en Cloudinary con URLs seguras.</p>
    <h2 className="text-white text-lg font-bold mt-8">4. Datos de Ubicación</h2>
    <p>La app móvil utiliza GPS para detectar tu proximidad a sucursales de gimnasios (geofencing). Esta información se procesa localmente en tu dispositivo y solo se envía al servidor cuando se registra una visita confirmada.</p>
    <h2 className="text-white text-lg font-bold mt-8">5. Tus Derechos</h2>
    <p>Puedes acceder, modificar o eliminar tus datos personales en cualquier momento desde la sección "Mis Datos Personales" de la aplicación. Para solicitar la eliminación completa de tu cuenta, contacta al administrador del sistema.</p>
    <h2 className="text-white text-lg font-bold mt-8">6. Cookies y Tokens</h2>
    <p>Utilizamos tokens JWT almacenados de forma segura (SecureStore en móvil, cookies HttpOnly en web) para mantener tu sesión activa. No utilizamos cookies de terceros con fines publicitarios.</p>
  </Shell>
);

export const ContactoPage = () => (
  <Shell title="Contacto">
    <p className="text-lg text-gray-300">GymSync Suite es un proyecto académico desarrollado en la Universidad Privada del Valle (UNIVALLE).</p>

    <h2 className="text-white text-lg font-bold mt-8">Equipo de Desarrollo</h2>
    <div className="grid sm:grid-cols-2 gap-4 mt-4">
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <p className="text-white font-semibold">Rene Aaron Sendoya Baqueros</p>
        <p className="text-gray-500 text-sm mt-1">Desarrollador Full-Stack</p>
      </div>
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <p className="text-white font-semibold">Sebastian Fernandez Conde</p>
        <p className="text-gray-500 text-sm mt-1">Desarrollador Full-Stack</p>
      </div>
    </div>

    <h2 className="text-white text-lg font-bold mt-8">Institución</h2>
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 mt-4">
      <p className="text-white font-semibold">Universidad Privada del Valle</p>
      <p className="text-gray-500 text-sm mt-1">UNIVALLE — Santa Cruz de la Sierra, Bolivia</p>
    </div>

    <h2 className="text-white text-lg font-bold mt-8">Stack Tecnológico</h2>
    <p>Backend: NestJS + TypeORM + PostgreSQL. Frontend Web: React + Tailwind CSS. App Móvil: React Native + Expo. Tiempo real: Socket.io. Media: Cloudinary. Auth: JWT.</p>
  </Shell>
);
