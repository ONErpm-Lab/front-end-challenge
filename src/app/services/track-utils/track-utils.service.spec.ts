import { TestBed } from "@angular/core/testing";

import { TrackUtilsService } from "./track-utils.service";

describe("TrackUtilsService", () => {
  let service: TrackUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackUtilsService);
    spyOn(window, "open").and.stub();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should format duration correctly for minutes and seconds", () => {
    const durationMs = 125000; // 2 minutes and 5 seconds
    const result = service.formatDuration(durationMs);
    expect(result).toBe("2:05");
  });

  it("should return single artist name", () => {
    const artists = [{ name: "Artist One" }];
    const result = service.getArtistsNames(artists);
    expect(result).toBe("Artist One");
  });

  it("should return true for track with valid preview_url", () => {
    const track = {
      name: "Test Track",
      preview_url: "https://example.com/preview.mp3",
    };
    const result = service.hasValidPreview(track);
    expect(result).toBe(true);
  });

  it("should open Spotify URL in new tab when track has valid Spotify URL", () => {
    const track = {
      name: "Test Track",
      external_urls: {
        spotify: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
      },
    };

    service.openSpotify(track);

    expect(window.open).toHaveBeenCalledWith(
      "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
      "_blank"
    );
  });
});
