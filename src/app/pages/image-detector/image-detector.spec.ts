import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageDetector } from './image-detector';

describe('ImageDetector', () => {
  let component: ImageDetector;
  let fixture: ComponentFixture<ImageDetector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageDetector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageDetector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
