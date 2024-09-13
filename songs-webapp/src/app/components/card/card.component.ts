import { Component, Input, signal, ViewChild, ElementRef } from '@angular/core';
import { SongInterface } from '../../SongInterface';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})

export class CardComponent {
  
  @Input({ required: true }) song!: SongInterface
  @ViewChild('audio', {static : true }) 
  audioElement!: ElementRef<HTMLAudioElement>
  @ViewChild('timeline') timelineElement!: ElementRef<HTMLInputElement>

  playImgSrc = signal('assets/play-circle-fill.svg')
  soundImgSrc = signal('assets/speaker-high-fill.svg')

  //Os metodos abaixo são responsaveis por controlar o audio do card
  toggleAudio () {

    if (this.audioElement.nativeElement.paused) {

      this.audioElement.nativeElement.play()
      this.playImgSrc.set('assets/pause-fill.svg')
    } else {

      this.audioElement.nativeElement.pause()
      this.playImgSrc.set('assets/play-circle-fill.svg')
    }
  }

  changeTimelinePosition () {
    const percentagePosition = (100*this.audioElement.nativeElement.currentTime) / this.audioElement.nativeElement.duration
    this.timelineElement.nativeElement.style.backgroundSize = `${percentagePosition}% 100%`
    this.timelineElement.nativeElement.value = percentagePosition.toString()
    
  }

  audioEnded () {
    this.playImgSrc.set("assets/play-circle-fill.svg")
  }

  changeSeek () {
    const time = (Number(this.timelineElement.nativeElement.value) * this.audioElement.nativeElement.duration) / 100
    this.audioElement.nativeElement.currentTime = time
  }

  toggleSound () {
    if (this.audioElement.nativeElement.muted) {

      this.audioElement.nativeElement.muted = false
      this.soundImgSrc.set('assets/speaker-high-fill.svg')
    } else {

      this.audioElement.nativeElement.muted = true
      this.soundImgSrc.set('assets/speaker-slash-fill.svg')
    }
  }
}
