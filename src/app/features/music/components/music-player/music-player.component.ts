import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Song } from '../../../../core/models/song.model';
import { MusicPlayerService } from '../../../../core/services/music-player.service';

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './music-player.component.html',
  styles: [`
    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translate(-50%, 20px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }

    @keyframes marquee {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }

    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }

    .text-container {
      overflow: hidden;
      position: relative;
      width: 100%;
    }

    .animate-marquee {
      display: inline-block;
      padding-right: 2rem;
      animation: marquee 10s linear infinite;
    }

    .animate-marquee::after {
      content: attr(data-text);
      position: absolute;
      white-space: nowrap;
      padding-left: 2rem;
    }

    .volume-slider-horizontal {
      -webkit-appearance: none;
      appearance: none;
      width: 80px;
      height: 3px;
      background: #e5e7eb;
      border-radius: 5px;
      outline: none;
      cursor: pointer;
    }

    .volume-slider-horizontal::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 10px;
      height: 10px;
      background: #2563eb;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.15s ease;
    }

    .volume-slider-horizontal::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }

    .volume-slider-horizontal::-moz-range-thumb {
      width: 10px;
      height: 10px;
      background: #2563eb;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      transition: transform 0.15s ease;
    }

    .volume-slider-horizontal::-moz-range-thumb:hover {
      transform: scale(1.2);
    }
  `]
})
export class MusicPlayerComponent implements OnDestroy, AfterViewChecked {
  @ViewChild('titleElement', { static: false }) titleElement?: ElementRef<HTMLSpanElement>;
  @ViewChild('artistElement', { static: false }) artistElement?: ElementRef<HTMLSpanElement>;

  @Input() isVisible = false;

  @Output() close = new EventEmitter<void>();
  @Output() toggleFavorite = new EventEmitter<string>();

  // Estado desde el servicio
  currentSong: Song | null = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  progress = 0;
  volume = 50;

  isTitleOverflowing = false;
  isArtistOverflowing = false;

  private subscriptions = new Subscription();
  private checkOverflowTimeout?: any;
  private lastSongId?: string;

  constructor(public playerService: MusicPlayerService) {
    this.subscribeToService();
  }

  private subscribeToService(): void {
    this.subscriptions.add(
      this.playerService.currentSong$.subscribe(song => {
        const isDifferentSong = this.lastSongId !== song?.id;
        this.currentSong = song;

        if (isDifferentSong && song) {
          this.lastSongId = song.id;
          this.isTitleOverflowing = false;
          this.isArtistOverflowing = false;

          if (this.titleElement) {
            this.titleElement.nativeElement.removeAttribute('data-text');
          }
          if (this.artistElement) {
            this.artistElement.nativeElement.removeAttribute('data-text');
          }

          setTimeout(() => this.checkTextOverflow(), 150);
        }
      })
    );

    this.subscriptions.add(
      this.playerService.isPlaying$.subscribe(playing => this.isPlaying = playing)
    );

    this.subscriptions.add(
      this.playerService.currentTime$.subscribe(time => this.currentTime = time)
    );

    this.subscriptions.add(
      this.playerService.duration$.subscribe(dur => this.duration = dur)
    );

    this.subscriptions.add(
      this.playerService.progress$.subscribe(prog => this.progress = prog)
    );

    this.subscriptions.add(
      this.playerService.volume$.subscribe(vol => this.volume = vol)
    );
  }

  ngAfterViewChecked(): void {
    if (this.checkOverflowTimeout) {
      clearTimeout(this.checkOverflowTimeout);
    }
    this.checkOverflowTimeout = setTimeout(() => {
      this.checkTextOverflow();
    }, 100);
  }

  private checkTextOverflow(): void {
    this.isTitleOverflowing = false;
    this.isArtistOverflowing = false;

    setTimeout(() => {
      if (this.titleElement) {
        const element = this.titleElement.nativeElement;
        const parent = element.parentElement;
        if (parent) {
          const isOverflowing = element.scrollWidth > parent.clientWidth;
          this.isTitleOverflowing = isOverflowing;

          if (isOverflowing) {
            element.setAttribute('data-text', this.currentSong?.title || '');
          } else {
            element.removeAttribute('data-text');
          }
        }
      }

      if (this.artistElement) {
        const element = this.artistElement.nativeElement;
        const parent = element.parentElement;
        if (parent) {
          const isOverflowing = element.scrollWidth > parent.clientWidth;
          this.isArtistOverflowing = isOverflowing;

          if (isOverflowing) {
            element.setAttribute('data-text', this.currentSong?.artist.artisticName || '');
          } else {
            element.removeAttribute('data-text');
          }
        }
      }
    }, 50);
  }

  togglePlay(): void {
    this.playerService.togglePlay();
  }

  playNext(): void {
    this.playerService.playNext();
  }

  playPrevious(): void {
    this.playerService.playPrevious();
  }

  toggleMute(): void {
    this.playerService.toggleMute();
  }

  onVolumeChange(): void {
    this.playerService.setVolume(this.volume);
  }

  onProgressClick(event: MouseEvent): void {
    if (this.duration === 0) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    this.playerService.seek(Math.max(0, Math.min(100, percentage)));
  }

  onToggleFavorite(): void {
    if (this.currentSong) {
      this.toggleFavorite.emit(this.currentSong.id);
    }
  }

  onClose(): void {
    this.playerService.stop();
    this.close.emit();
  }

  formatTime(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  get hasPrevious(): boolean {
    return this.playerService.hasPrevious;
  }

  get hasNext(): boolean {
    return this.playerService.hasNext;
  }

  ngOnDestroy(): void {
    if (this.checkOverflowTimeout) {
      clearTimeout(this.checkOverflowTimeout);
    }
    this.subscriptions.unsubscribe();
  }
}
