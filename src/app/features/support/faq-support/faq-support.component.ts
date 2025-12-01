import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

/**
 * Interfaz que representa una pregunta frecuente (FAQ)
 */
export interface FAQ {
  /** Pregunta del FAQ */
  pregunta: string;
  /** Respuesta del FAQ */
  respuesta: string;
  /** Categoría a la que pertenece la pregunta */
  categoria: string;
  /** Indica si el FAQ está expandido o colapsado */
  abierta?: boolean;
}

/**
 * Componente para mostrar la sección de preguntas frecuentes (FAQ)
 * con filtrado por categoría y búsqueda en tiempo real
 *
 * @example
 * <app-faq-support></app-faq-support>
 */
@Component({
  selector: 'app-faq-support',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './faq-support.component.html',
  styleUrls: ['./faq-support.component.scss'],
})
export class FaqSupportComponent {
  /** Texto de búsqueda para filtrar preguntas */
  searchText: string = '';

  /** Categoría seleccionada para filtrar las preguntas */
  categoriaSeleccionada: string = 'Todas';

  /** Lista de categorías disponibles en el FAQ */
  categorias: string[] = [
    'Todas',
    'General',
    'Cuenta y Acceso',
    'Artistas',
    'Música y Reproducción',
    'Compras Simuladas',
    'Recomendaciones',
    'Seguridad y Privacidad',
    'Soporte y Contacto',
    'Problemas Técnicos',
    'Compatibilidad'
  ];

  /** Lista completa de preguntas frecuentes */
  faqs: FAQ[] = [
    {
      pregunta: '¿Qué es Ondra?',
      respuesta: 'Ondra es una plataforma musical diseñada para descubrir, escuchar y apoyar a artistas emergentes. Permite explorar música nueva, acceder a perfiles de artistas y disfrutar de contenido independiente.',
      categoria: 'General'
    },
    {
      pregunta: '¿Ondra es gratuita?',
      respuesta: 'Sí, Ondra es completamente gratuita. El módulo de compra de canciones o álbumes es solo un simulador incluido por motivos académicos.',
      categoria: 'General'
    },
    {
      pregunta: '¿Qué puedo hacer como usuario registrado?',
      respuesta: 'Como usuario puedes: escuchar canciones, explorar artistas, guardar favoritos, recibir recomendaciones personalizadas y configurar tu perfil básico.',
      categoria: 'General'
    },
    {
      pregunta: '¿Cómo puedo registrarme o iniciar sesión?',
      respuesta: 'Desde la página principal puedes: crear una cuenta con tu correo electrónico, o iniciar sesión con Google mediante autenticación segura.',
      categoria: 'Cuenta y Acceso'
    },
    {
      pregunta: '¿Qué hago si olvidé mi contraseña?',
      respuesta: 'Usa la opción "¿Olvidaste tu contraseña?" en la pantalla de inicio. Se enviará un código de verificación a tu correo electrónico.',
      categoria: 'Cuenta y Acceso'
    },
    {
      pregunta: 'No recibo el código de verificación, ¿qué hago?',
      respuesta: 'Comprueba la carpeta de spam. Si no llega, solicita un nuevo código y verifica que tu correo esté escrito correctamente.',
      categoria: 'Cuenta y Acceso'
    },
    {
      pregunta: '¿Puedo eliminar mi cuenta?',
      respuesta: 'Sí. Puedes solicitarlo escribiendo a soporte.',
      categoria: 'Cuenta y Acceso'
    },
    {
      pregunta: '¿Puedo tener varias cuentas?',
      respuesta: 'Es posible, aunque no recomendable. Las cuentas creadas con fines fraudulentos podrán ser suspendidas.',
      categoria: 'Cuenta y Acceso'
    },
    {
      pregunta: 'Soy artista, ¿qué opciones tengo en Ondra?',
      respuesta: 'Los artistas pueden: subir canciones, organizar álbumes, editar su perfil, gestionar portadas y descripciones, y ver cómo los usuarios interactúan con su música.',
      categoria: 'Artistas'
    },
    {
      pregunta: '¿Qué formatos de audio acepta Ondra?',
      respuesta: 'Dependiendo del módulo final del proyecto, Ondra acepta formatos comunes como MP3 o WAV. Se recomienda que los archivos sean de buena calidad.',
      categoria: 'Artistas'
    },
    {
      pregunta: '¿Cuánto tarda en publicarse mi canción?',
      respuesta: 'Generalmente aparece al instante, salvo incidencias técnicas.',
      categoria: 'Artistas'
    },
    {
      pregunta: '¿Puedo editar o eliminar mis canciones o álbumes?',
      respuesta: 'Sí. Los artistas pueden gestionar su catálogo desde su panel personal.',
      categoria: 'Artistas'
    },
    {
      pregunta: '¿Cómo funciona el reproductor de Ondra?',
      respuesta: 'El reproductor permite: reproducir, pausar y saltar canciones; ajustar volumen; activar modo aleatorio o repetición; continuar escuchando incluso mientras navegas por la plataforma.',
      categoria: 'Música y Reproducción'
    },
    {
      pregunta: '¿Ondra guarda mis ajustes de reproducción?',
      respuesta: 'Sí, utiliza almacenamiento local del navegador para guardar: volumen, modo aleatorio, repetición y última canción reproducida.',
      categoria: 'Música y Reproducción'
    },
    {
      pregunta: '¿Por qué no puedo reproducir una canción?',
      respuesta: 'Puede deberse a: problemas temporales del servidor, mala conexión a internet, o formato de archivo incorrecto (si lo subió un artista). Si el error persiste, contacta con soporte.',
      categoria: 'Música y Reproducción'
    },
    {
      pregunta: '¿Ondra permite comprar música?',
      respuesta: 'Sí, pero solo como simulación. No se gestionan pagos reales, ni se piden datos bancarios.',
      categoria: 'Compras Simuladas'
    },
    {
      pregunta: '¿Las compras generan cargos reales?',
      respuesta: 'No. Todo el sistema simula el proceso de compra sin realizar transacciones.',
      categoria: 'Compras Simuladas'
    },
    {
      pregunta: '¿Cómo funcionan las recomendaciones en Ondra?',
      respuesta: 'Ondra utiliza tu interacción dentro de la plataforma para sugerirte: artistas relacionados, géneros similares y canciones que podrían gustarte. No se utiliza ningún perfilado comercial externo.',
      categoria: 'Recomendaciones'
    },
    {
      pregunta: '¿Se usan mis datos personales para recomendaciones?',
      respuesta: 'No se procesan datos sensibles. Solo se usa tu actividad dentro de Ondra.',
      categoria: 'Recomendaciones'
    },
    {
      pregunta: '¿Es seguro el acceso a mi cuenta?',
      respuesta: 'Sí. Ondra utiliza: contraseñas cifradas, tokens JWT seguros, sesiones protegidas y medidas internas de seguridad.',
      categoria: 'Seguridad y Privacidad'
    },
    {
      pregunta: '¿Ondra comparte mis datos con terceros?',
      respuesta: 'Solo con servicios necesarios para el funcionamiento técnico, como autenticación con Google. Nunca para fines publicitarios.',
      categoria: 'Seguridad y Privacidad'
    },
    {
      pregunta: '¿Dónde se almacenan los archivos multimedia?',
      respuesta: 'En los servicios internos de la plataforma o proveedores configurados para almacenamiento seguro.',
      categoria: 'Seguridad y Privacidad'
    },
    {
      pregunta: '¿Cómo contacto con el equipo de Ondra?',
      respuesta: 'Puedes escribirnos a: 📩 soporte@ondra.app',
      categoria: 'Soporte y Contacto'
    },
    {
      pregunta: '¿Qué información debo enviar al reportar un error?',
      respuesta: 'Incluye: breve descripción del problema, capturas de pantalla si es posible, dispositivo y navegador utilizados, y pasos previos al error.',
      categoria: 'Soporte y Contacto'
    },
    {
      pregunta: '¿Dónde puedo enviar sugerencias o feedback?',
      respuesta: 'Puedes enviarlas a: 📬 feedback@ondra.app',
      categoria: 'Soporte y Contacto'
    },
    {
      pregunta: 'La página carga en blanco o incompleta',
      respuesta: 'Prueba: recargar con CTRL + F5, borrar la caché del navegador, cerrar sesión y volver a entrar, o revisar extensiones que bloqueen scripts.',
      categoria: 'Problemas Técnicos'
    },
    {
      pregunta: 'El audio se corta o no suena',
      respuesta: 'Puede deberse a: mala conexión, archivo de audio incorrecto, o navegador incompatible. Ondra funciona mejor en: Chrome, Edge, Firefox y Safari recientes.',
      categoria: 'Problemas Técnicos'
    },
    {
      pregunta: '¿Qué navegadores son compatibles?',
      respuesta: 'Ondra funciona correctamente en: Chrome, Edge, Firefox y Safari. No se garantizan versiones antiguas de navegadores.',
      categoria: 'Compatibilidad'
    }
  ];

  /**
   * Cambia la categoría seleccionada para filtrar preguntas
   * @param categoria Nueva categoría seleccionada
   */
  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;
  }

  /**
   * Alterna el estado de apertura de un FAQ (expandido / colapsado)
   * @param faq FAQ que se desea alternar
   */
  toggleFAQ(faq: FAQ): void {
    faq.abierta = !faq.abierta;
  }

  /**
   * Obtiene la lista de preguntas filtradas según la categoría
   * seleccionada y el texto de búsqueda
   * @returns Array de FAQs filtradas
   */
  get faqsFiltradas(): FAQ[] {
    return this.faqs.filter(faq => {
      const coincideCategoria =
        this.categoriaSeleccionada === 'Todas' ||
        faq.categoria === this.categoriaSeleccionada;

      const coincideBusqueda =
        this.searchText === '' ||
        faq.pregunta.toLowerCase().includes(this.searchText.toLowerCase()) ||
        faq.respuesta.toLowerCase().includes(this.searchText.toLowerCase());

      return coincideCategoria && coincideBusqueda;
    });
  }
}
