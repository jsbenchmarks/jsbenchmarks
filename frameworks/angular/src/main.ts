import { bootstrapApplication } from '@angular/platform-browser';
import "common/main.css";
import 'zone.js';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((err) => console.error(err));
