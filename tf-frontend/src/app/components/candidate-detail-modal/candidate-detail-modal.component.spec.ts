import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CandidateDetailModalComponent } from './candidate-detail-modal.component';

describe('CandidateDetailModalComponent', () => {
  let component: CandidateDetailModalComponent;
  let fixture: ComponentFixture<CandidateDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateDetailModalComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
