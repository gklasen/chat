import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  constructor(private translate: TranslateService, theme: ThemeService) {
    // unterstützte Sprachen
    translate.addLangs(['de', 'en']);

    // optional: Browser-Sprache verwenden, fallback de
    const browser = translate.getBrowserLang();
    translate.use(browser === 'en' ? 'en' : 'de');
	
	theme.init();
  }
}