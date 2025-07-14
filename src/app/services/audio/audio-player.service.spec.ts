import { TestBed } from "@angular/core/testing";
import { AudioPlayerService } from "./audio-player.service";

describe("AudioPlayerService", () => {
  let service: AudioPlayerService;
  let mockAudio: any;

  beforeEach(() => {
    mockAudio = {
      play: jasmine.createSpy("play").and.returnValue(Promise.resolve()),
      pause: jasmine.createSpy("pause"),
      addEventListener: jasmine.createSpy("addEventListener"),
      removeEventListener: jasmine.createSpy("removeEventListener"),
      paused: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      src: "",
    };

    spyOn(window, "Audio").and.returnValue(mockAudio as any);

    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioPlayerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should play track with valid preview_url", () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };
    spyOn(service as any, "pause");

    service["playTrack"](track);

    expect(service["pause"]).toHaveBeenCalled();
    expect(window.Audio).toHaveBeenCalledWith("http://example.com/track.mp3");
    expect(mockAudio.play).toHaveBeenCalled();
    expect(mockAudio.addEventListener).toHaveBeenCalledWith(
      "ended",
      jasmine.any(Function)
    );
  });

  it("should not play track without preview_url", () => {
    const track = { id: "123", preview_url: null };
    spyOn(service as any, "pause");

    service["playTrack"](track);

    expect(service["pause"]).toHaveBeenCalled();
    expect(window.Audio).not.toHaveBeenCalled();
  });

  it("should handle audio play error", async () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };
    mockAudio.play.and.returnValue(Promise.reject("Audio error"));
    spyOn(console, "error");
    spyOn(service as any, "onAudioError");

    service["playTrack"](track);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(console.error).toHaveBeenCalledWith(
      "Erro ao reproduzir áudio:",
      "Audio error"
    );
    expect(service["onAudioError"]).toHaveBeenCalled();
  });

  it("should pause current audio", () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };

    service["playTrack"](track);
    service["pause"]();

    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it("should return true when track is playing", () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };
    mockAudio.paused = false;

    service["playTrack"](track);

    expect(service.isPlaying("123")).toBe(true);
  });

  it("should return false when track is not playing", () => {
    expect(service.isPlaying("123")).toBe(false);
  });

  it("should destroy audio player correctly", () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };

    service["playTrack"](track);

    service.destroy();

    
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(service["currentAudio"]).toBeNull();
    expect(service.isPlaying("123")).toBe(false);
  });

  it("should handle audio ended correctly", () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };

    service["playTrack"](track);

    service["onAudioEnded"]();

    
    expect(service["currentAudio"]).toBeNull();

    service.currentPlayingId$.subscribe((id) => {
      expect(id).toBeNull();
    });
  });

  it("should handle audio error correctly", () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };

    service["playTrack"](track);
    expect(service["currentAudio"]).toBeTruthy();

    service["onAudioError"]();

    
    expect(service["currentAudio"]).toBeNull();

    service.currentPlayingId$.subscribe((id) => {
      expect(id).toBeNull();
    });
  });

  it("should pause track when it is currently playing", () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };
    spyOn(service, "isPlaying").and.returnValue(true);
    spyOn(service as any, "pause");

    service.togglePlay(track);

    expect(service.isPlaying).toHaveBeenCalledWith("123");
    expect(service["pause"]).toHaveBeenCalled();
  });

  it("should play track when it is not currently playing", () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };
    spyOn(service, "isPlaying").and.returnValue(false);
    spyOn(service as any, "playTrack");

    service.togglePlay(track);

    expect(service.isPlaying).toHaveBeenCalledWith("123");
    expect(service["playTrack"]).toHaveBeenCalledWith(track);
  });

  it("should call onAudioEnded when audio ends", () => {
    const track = { id: "123", preview_url: "http://example.com/track.mp3" };
    spyOn(service as any, "onAudioEnded");

    service["playTrack"](track);

    const endedCallback = mockAudio.addEventListener.calls.argsFor(0)[1];
    endedCallback();

    expect(service["onAudioEnded"]).toHaveBeenCalled();
  });
});
