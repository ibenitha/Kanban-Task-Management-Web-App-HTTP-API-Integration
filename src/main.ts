import 'zone.js'; // classic Angular change detection: DOM events, Promises and
// Observable .subscribe() callbacks (like ActivatedRoute.paramMap.subscribe)
// all automatically trigger a re-render, so components don't need to call
// ChangeDetectorRef.markForCheck() by hand.
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
