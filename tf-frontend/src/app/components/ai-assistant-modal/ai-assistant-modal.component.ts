import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, JobAssistantRequest, GeneratedJobPosting } from '../../services/assistant.service';

@Component({
  selector: 'app-ai-assistant-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant-modal.component.html',
  styleUrls: ['./ai-assistant-modal.component.css']
})
export class AiAssistantModalComponent {
  @Input() companyName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() fieldsGenerated = new EventEmitter<GeneratedJobPosting>();

  // Estado del modal
  currentStep: number = 1;
  generating: boolean = false;
  errorMessage: string = '';

  // Preguntas del asistente
  recruiterDescription: string = '';
  additionalContext: string = '';

  // Datos generados
  generatedData: GeneratedJobPosting | null = null;

  constructor(private assistantService: AssistantService) {}

  closeModal() {
    this.close.emit();
  }

  // Prevenir cierre al hacer click dentro del modal
  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  goToNextStep() {
    if (this.currentStep === 1 && !this.recruiterDescription.trim()) {
      this.errorMessage = 'Por favor, describe las tareas y responsabilidades del puesto';
      return;
    }

    this.errorMessage = '';
    this.currentStep++;
  }

  goToPreviousStep() {
    this.currentStep--;
    this.errorMessage = '';
  }

  generateJobPosting() {
    if (!this.recruiterDescription.trim()) {
      this.errorMessage = 'La descripción no puede estar vacía';
      return;
    }

    this.generating = true;
    this.errorMessage = '';

    const request: JobAssistantRequest = {
      recruiter_description: this.recruiterDescription,
      company_name: this.companyName || undefined,
      additional_context: this.additionalContext || undefined
    };

    this.assistantService.generateJobPosting(request).subscribe({
      next: (response) => {
        console.log('✅ Oferta generada:', response);
        this.generatedData = response;
        this.generating = false;
        this.currentStep = 3; // Ir a pantalla de confirmación
      },
      error: (error) => {
        console.error('❌ Error generando oferta:', error);
        this.generating = false;
        this.errorMessage = error.error?.detail || 'Error al generar la oferta. Intenta nuevamente.';
      }
    });
  }

  applyGeneratedFields() {
    if (this.generatedData) {
      this.fieldsGenerated.emit(this.generatedData);
      this.closeModal();
    }
  }

  resetAndClose() {
    this.currentStep = 1;
    this.recruiterDescription = '';
    this.additionalContext = '';
    this.generatedData = null;
    this.errorMessage = '';
    this.closeModal();
  }
}
