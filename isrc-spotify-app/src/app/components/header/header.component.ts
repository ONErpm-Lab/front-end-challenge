import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageSelectorComponent } from '../../core/components/language-selector/language-selector.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LanguageSelectorComponent, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
