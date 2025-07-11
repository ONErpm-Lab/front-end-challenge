import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { SpotifyApiService } from '../../services/spotify-api/spotify-api.service';
import { SortPipe } from '../../pipes/sort/sort.pipe';
import { Track } from '../../interfaces/track';

@Component({
  selector: 'app-isrc-search',
  imports: [CommonModule, MatInputModule, MatButtonModule, ReactiveFormsModule, SortPipe],
  templateUrl: './isrc-search.component.html',
  styleUrl: './isrc-search.component.scss'
})
export class IsrcSearchComponent implements OnInit {
  form!: FormGroup;
  tracks: Track[] = [];

  constructor(private spotifyApiService: SpotifyApiService) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = new FormGroup({
      isrc: new FormControl('', [Validators.required])
    });
  }

  get isrc(): FormControl {
    return this.form.get('isrc')! as FormControl;
  }

  searchIsrc(): void {
    if (this.form.valid) {
      this.spotifyApiService.searchTracksByIsrc(this.isrc.value).subscribe(data => this.tracks = data);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
