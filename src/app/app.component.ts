import { NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnInit,
  signal,
  computed,
  ViewChild,
  ElementRef,
  inject,
  OnDestroy,
} from '@angular/core';
import { environment } from '../environments/environment';
import { Track } from './models/track.model';
import { tracks } from './tracks';

@Component({
  selector: 'app-root',
  standalone: true, // Add standalone component
  imports: [NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'music-player';
  apiURL = environment.apiUrl + '/visit';
  private readonly http = inject(HttpClient);
  @ViewChild('trackListContainer')
  private readonly trackListContainer!: ElementRef;

  // Signals
  protected readonly volume = signal(50); // Start at 50% volume
  protected readonly tracks = signal<Track[]>(tracks);
  protected readonly currentTrackIndex = signal(0);
  protected readonly isPlaying = signal(false);
  protected readonly progress = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly isMuted = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);

  // Computed values
  protected readonly filteredTracks = computed(() =>
    this.tracks().filter(
      (track) =>
        track.title.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        track.artist.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  private audio: HTMLAudioElement | null = null;
  private readonly audioContext = new AudioContext();
  private gainNode: GainNode | null = null;

  ngOnInit(): void {
    this.initializeAudio();
    this.logVisit();
    window.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initializeAudio(): void {
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.loadTrack();
  }

  private cleanup(): void {
    window.removeEventListener('keydown', this.handleKeydown.bind(this));
    this.audio?.pause();
    this.audioContext.close();
  }

  private logVisit(): void {
    this.http
      .post(this.apiURL, {
        projectName: this.title,
      })
      .subscribe({
        next: (response) => {
          console.log('Data posted successfully:', response);
        },
        error: (error) => {
          console.error('Error posting data:', error);
        },
      });
  }

  handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case ' ':
        event.preventDefault();
        this.handlePlayPause();
        break;
      case 'ArrowRight':
        this.handleNext();
        break;
      case 'ArrowLeft':
        this.handlePrevious();
        break;
      case 'ArrowUp':
        this.increaseVolume();
        break;
      case 'ArrowDown':
        this.decreaseVolume();
        break;
      case 'm':
        this.toggleMute();
        break;
      case 's':
        this.handleSearch(event);
        break;
    }
  }

  loadTrack() {
    this.audio?.pause();
    const currentTrack = this.filteredTracks()[this.currentTrackIndex()];
    this.audio = new Audio(currentTrack.url);

    // Add existing event listeners
    this.audio.addEventListener('timeupdate', this.updateProgress.bind(this));
    this.audio.addEventListener('ended', this.handleNext.bind(this));
    this.audio.addEventListener('canplay', () => this.error.set(null));
    this.audio.addEventListener('error', () => {
      this.error.set('Unable to load audio. Please check the audio source.');
      this.isPlaying.set(false);
    });

    // Apply volume settings
    if (this.volume() !== null) {
      this.setVolume(this.volume());
    }

    // Apply mute state to new audio instance
    if (this.audio) {
      this.audio.muted = this.isMuted();
    }
  }

  handleVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.volume.set(value);
    this.setVolume(value);
  }

  increaseVolume() {
    const newVolume = Math.min((this.volume() || 50) + 10, 100);
    this.volume.set(newVolume);
    this.setVolume(newVolume);
  }

  decreaseVolume() {
    const newVolume = Math.max((this.volume() || 50) - 10, 0);
    this.volume.set(newVolume);
    this.setVolume(newVolume);
  }

  setVolume(value: number) {
    if (this.audio) {
      this.audio.volume = value / 100;
    }
  }

  handlePlayPause() {
    if (this.audio) {
      if (this.isPlaying()) {
        this.audio.pause();
      } else {
        this.audio.play().catch(() => {
          this.error.set('Playback failed. Please try again.');
        });
      }
      this.isPlaying.set(!this.isPlaying());
    }
  }

  scrollToCurrentTrack() {
    const container = this.trackListContainer.nativeElement;
    const selectedTrack = container.children[this.currentTrackIndex()];
    if (selectedTrack) {
      selectedTrack.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  handleNext() {
    this.currentTrackIndex.set(
      (this.currentTrackIndex() + 1) % this.filteredTracks().length
    );
    this.loadTrack();
    this.isPlaying.set(true);
    this.audio?.play();
    this.scrollToCurrentTrack();
  }

  handlePrevious() {
    this.currentTrackIndex.set(
      (this.currentTrackIndex() - 1 + this.filteredTracks().length) %
        this.filteredTracks().length
    );
    this.loadTrack();
    this.isPlaying.set(true);
    this.audio?.play();
    this.scrollToCurrentTrack();
  }

  handleSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.progress.set(value);

    if (this.audio) {
      const newTime = (value / 100) * this.audio.duration;
      this.audio.currentTime = newTime;
    }
  }

  handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  handleTrackSelect(index: number) {
    const trackIndex = this.tracks().findIndex(
      (track) => track.title === this.filteredTracks()[index].title
    );
    if (trackIndex !== -1) {
      this.currentTrackIndex.set(trackIndex);
      this.loadTrack();
      this.isPlaying.set(true);
      this.audio?.play();
      this.scrollToCurrentTrack();
    }
  }

  toggleMute() {
    this.isMuted.set(!this.isMuted());
    if (this.audio) {
      this.audio.muted = this.isMuted();
    }
  }

  updateProgress() {
    if (this.audio) {
      const duration = this.audio.duration || 1;
      const currentTime = this.audio.currentTime;
      this.progress.set((currentTime / duration) * 100);
      this.currentTime.set(currentTime);
      this.duration.set(duration);
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
