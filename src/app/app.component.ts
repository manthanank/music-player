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
} from '@angular/core';
import { environment } from '../environments/environment';

interface Track {
  title: string;
  artist: string;
  url: string;
}

@Component({
  selector: 'app-root',
  imports: [NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'music-player';
  apiURL = environment.apiUrl;

  @ViewChild('trackListContainer') trackListContainer!: ElementRef;
  volume = signal(100);
  tracks: Track[] = [
    {
      title: 'Serenity',
      artist: 'Piano and Strings',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      title: 'Energetic Beats',
      artist: 'Drum and Bass Collective',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
      title: 'Smooth Jazz',
      artist: 'Sax and Keys',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
    {
      title: 'Classical Symphony',
      artist: 'Orchestra Ensemble',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    },
    {
      title: 'Electronic Dreams',
      artist: 'Synthwave Collective',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    },
    {
      title: 'Ambient Relaxation',
      artist: 'Chillout Lounge',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    },
    {
      title: 'Country Folk',
      artist: 'Acoustic Guitar Trio',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    },
    {
      title: 'Rocking Blues',
      artist: 'Electric Guitar Band',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    },
    {
      title: 'Hip Hop Beats',
      artist: 'Rap Collective',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    },
    {
      title: 'Reggae Vibes',
      artist: 'Island Rhythms',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    },
  ];

  currentTrackIndex = signal(0);
  isPlaying = signal(false);
  progress = signal(0);
  error = signal<string | null>(null);
  searchQuery = signal('');
  isMuted = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  filteredTracks = computed(() =>
    this.tracks.filter((track) =>
      track.title.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );
  private audio: HTMLAudioElement | null = null;

  http = inject(HttpClient);

  ngOnInit() {
    this.http
      .post(this.apiURL, {
        website: window.location.href,
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
    this.http.get(window.location.href).subscribe({
      next: (response) => {
        console.log('Data fetched successfully:', response);
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
    this.loadTrack();
    window.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.handleKeydown.bind(this));
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
    this.audio = new Audio(this.tracks[this.currentTrackIndex()].url);

    this.audio.addEventListener('timeupdate', this.updateProgress.bind(this));
    this.audio.addEventListener('ended', this.handleNext.bind(this));
    this.audio.addEventListener('canplay', () => this.error.set(null));
    this.audio.addEventListener('error', () => {
      this.error.set('Unable to load audio. Please check the audio source.');
      this.isPlaying.set(false);
    });
    if (this.volume() !== null) {
      this.setVolume(this.volume());
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
      (this.currentTrackIndex() + 1) % this.tracks.length
    );
    this.loadTrack();
    this.isPlaying.set(true);
    this.audio?.play();
    this.scrollToCurrentTrack();
  }

  handlePrevious() {
    this.currentTrackIndex.set(
      (this.currentTrackIndex() - 1 + this.tracks.length) % this.tracks.length
    );
    this.loadTrack();
    this.isPlaying.set(true);
    this.audio?.play();
    this.scrollToCurrentTrack();
  }

  handleTrackSelect(index: number) {
    this.currentTrackIndex.set(index);
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
