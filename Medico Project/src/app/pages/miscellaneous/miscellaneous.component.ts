import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'ngx-miscellaneous',
  templateUrl: './miscellaneous.component.html',
})
export class MiscellaneousComponent {
  @ViewChild('video') video: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;

  cameraAvailable: boolean = false;
  uploadedImageFile: File | Blob | null = null;  // stores captured or uploaded image
  uploadedImageUrl: string | null = null;        // preview for video block

  processingMessage: string = ''; // shows "Running model on ..."
  aiResultMessage: string = '';   // final AI result
  annotatedImage: string | null = null; // base64 from backend

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.startCamera();
  }

  startCamera() {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      if (videoDevices.length === 0) {
        console.warn('No camera found');
        return;
      }

      navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevices[0].deviceId } })
        .then(stream => {
          this.video.nativeElement.srcObject = stream;
          this.video.nativeElement.play();
          this.cameraAvailable = true;
        })
        .catch(err => {
          console.error('Error accessing camera:', err);
          this.cameraAvailable = false;
        });
    });
  }

  capture() {
    if (!this.cameraAvailable) return;

    const context = this.canvas.nativeElement.getContext('2d');
    context.drawImage(
      this.video.nativeElement,
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );

    this.canvas.nativeElement.toBlob((blob: Blob) => {
      this.uploadedImageFile = blob;
      this.uploadedImageUrl = URL.createObjectURL(blob); // show preview
      this.processingMessage = '';
      this.aiResultMessage = '';
      this.annotatedImage = null;
    }, 'image/jpeg');
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.uploadedImageFile = file;
    this.processingMessage = '';
    this.aiResultMessage = '';
    this.annotatedImage = null;

    const reader = new FileReader();
    reader.onload = () => {
      // stop camera if running
      if (this.cameraAvailable && this.video.nativeElement.srcObject) {
        const stream = this.video.nativeElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        this.cameraAvailable = false;
      }

      this.video.nativeElement.srcObject = null;
      this.uploadedImageUrl = reader.result as string; // show preview
    };
    reader.readAsDataURL(file);
  }

  analyzeImage() {
    if (!this.uploadedImageFile) return;

    this.processingMessage = 'Running model...';
    this.aiResultMessage = '';
    this.annotatedImage = null;

    const formData = new FormData();
    formData.append('image', this.uploadedImageFile, 'image.jpg');

    this.http.post<any>(
      'http://localhost:8000/api/check-prosthesis/',
      formData
    ).subscribe({
      next: (res) => {
        this.aiResultMessage =
          res.classification === 'good' ? 'Good placement ✅' : 'Bad placement ❌';
        this.processingMessage = '';

        if (res.annotated_image) {
          this.annotatedImage = res.annotated_image;
        }
      },
      error: (err) => {
        console.error('Error sending image:', err);
        this.processingMessage = '';
        this.aiResultMessage = 'Error processing image';
        this.annotatedImage = null;
      },
    });
  }
}
