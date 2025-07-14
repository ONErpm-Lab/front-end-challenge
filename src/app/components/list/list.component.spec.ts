import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Router } from "@angular/router";
import { of, Subject, throwError } from "rxjs";

import { AuthService } from "./../../core/auth/auth.service";
import { AudioPlayerService } from "./../../services/audio/audio-player.service";
import { NotificationService } from "./../../services/notification/notification.service";
import {
  PaginationService,
  PaginationState,
} from "./../../services/pagination/pagination.service";
import { SpotfyService } from "./../../services/spotfy/spotfy.service";
import { TokenService } from "./../../services/token/token.service";
import { TrackUtilsService } from "./../../services/track-utils/track-utils.service";

import { PageEvent } from "@angular/material/paginator";
import { ListComponent } from "./list.component";

describe("ListComponent", () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTokenService: jasmine.SpyObj<TokenService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSpotfyService: jasmine.SpyObj<SpotfyService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockAudioPlayerService: jasmine.SpyObj<AudioPlayerService>;
  let mockTrackUtilsService: jasmine.SpyObj<TrackUtilsService>;
  let mockPaginationService: jasmine.SpyObj<PaginationService>;

  const mockTracks = [
    { id: "1", name: "Track 1", preview_url: "url1" },
    { id: "2", name: "Track 2", preview_url: "url2" },
  ];

  const mockPaginationState: PaginationState = {
    pageIndex: 0,
    pageSize: 10,
    totalItems: 2,
    paginatedData: mockTracks,
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockTokenService = jasmine.createSpyObj("TokenService", ["getAccessToken"]);
    mockAuthService = jasmine.createSpyObj("AuthService", ["saveToken"]);
    mockSpotfyService = jasmine.createSpyObj("SpotfyService", [
      "getTracksByIsrcs",
    ]);
    mockNotificationService = jasmine.createSpyObj("NotificationService", [
      "getNotification",
    ]);
    mockAudioPlayerService = jasmine.createSpyObj(
      "AudioPlayerService",
      ["togglePlay", "isPlaying", "destroy"],
      {
        currentPlayingId$: of(null),
      }
    );
    mockTrackUtilsService = jasmine.createSpyObj("TrackUtilsService", [
      "formatDuration",
      "getArtistsNames",
      "hasValidPreview",
      "openSpotify",
    ]);
    mockPaginationService = jasmine.createSpyObj(
      "PaginationService",
      ["updatePagination", "setPageSize"],
      {
        paginationState$: of(mockPaginationState),
      }
    );

    // Configure os mocks ANTES de criar o componente
    mockTokenService.getAccessToken.and.returnValue(of("mock-token"));
    mockSpotfyService.getTracksByIsrcs.and.returnValue(of(mockTracks));
    mockNotificationService.getNotification.and.returnValue(
      new Subject<boolean>()
    );

    await TestBed.configureTestingModule({
      imports: [ListComponent, BrowserAnimationsModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: TokenService, useValue: mockTokenService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SpotfyService, useValue: mockSpotfyService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AudioPlayerService, useValue: mockAudioPlayerService },
        { provide: TrackUtilsService, useValue: mockTrackUtilsService },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    // Remova as configurações de mock daqui pois já foram feitas acima
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call getTracks when ngOnInit is called", () => {
    spyOn(component as any, "getTracks");

    component.ngOnInit();

    expect(component["getTracks"]).toHaveBeenCalled();
  });

  it("should update pagination when onPageChange is called", () => {
    const mockPageEvent: PageEvent = {
      pageIndex: 2,
      pageSize: 20,
      length: 100,
    };

    component.tracks = mockTracks;

    component.onPageChange(mockPageEvent);

    expect(component["lastPagination"]).toBe(20);
  });

  it("should call updatePagination with correct parameters", () => {
    const pageEvent: PageEvent = {
      pageIndex: 1,
      pageSize: 15,
      length: 50,
    };

    component.tracks = [{ id: "1", name: "Test Track" }];

    component.onPageChange(pageEvent);

    expect(mockPaginationService.updatePagination).toHaveBeenCalledTimes(1);
    expect(component["lastPagination"]).toEqual(15);
  });

  it("should call audioPlayerService.togglePlay when toggleAudio is called", () => {
    const mockTrack = { id: "1", name: "Test Track", preview_url: "url1" };

    component.toggleAudio(mockTrack);

    expect(mockAudioPlayerService.togglePlay).toHaveBeenCalledWith(mockTrack);
  });

  it("should call togglePlay with correct track parameter", () => {
    const track = mockTracks[0];

    component.toggleAudio(track);

    expect(mockAudioPlayerService.togglePlay).toHaveBeenCalledTimes(1);
    expect(mockAudioPlayerService.togglePlay).toHaveBeenCalledWith(track);
  });

  it("should return true when track is playing", () => {
    const trackId = "track-123";
    mockAudioPlayerService.isPlaying.and.returnValue(true);

    const result = component.isPlaying(trackId);

    expect(mockAudioPlayerService.isPlaying).toHaveBeenCalledWith(trackId);
    expect(result).toBe(true);
  });

  it("should return false when track is not playing", () => {
    const trackId = "track-456";
    mockAudioPlayerService.isPlaying.and.returnValue(false);

    const result = component.isPlaying(trackId);

    expect(mockAudioPlayerService.isPlaying).toHaveBeenCalledWith(trackId);
    expect(result).toBe(false);
  });

  it("should format duration correctly", () => {
    const durationMs = 180000; // 3 minutes
    const expectedFormat = "3:00";
    mockTrackUtilsService.formatDuration.and.returnValue(expectedFormat);

    const result = component.formatDuration(durationMs);

    expect(mockTrackUtilsService.formatDuration).toHaveBeenCalledWith(
      durationMs
    );
    expect(result).toBe(expectedFormat);
  });

  it("should call trackUtilsService.formatDuration with correct parameter", () => {
    const durationMs = 65000; // 1:05
    mockTrackUtilsService.formatDuration.and.returnValue("1:05");

    component.formatDuration(durationMs);

    expect(mockTrackUtilsService.formatDuration).toHaveBeenCalledTimes(1);
    expect(mockTrackUtilsService.formatDuration).toHaveBeenCalledWith(
      durationMs
    );
  });

  it("should get artists names correctly", () => {
    const mockArtists = [{ name: "Artist 1" }, { name: "Artist 2" }];
    const expectedNames = "Artist 1, Artist 2";
    mockTrackUtilsService.getArtistsNames.and.returnValue(expectedNames);

    const result = component.getArtistsNames(mockArtists);

    expect(mockTrackUtilsService.getArtistsNames).toHaveBeenCalledWith(
      mockArtists
    );
    expect(result).toBe(expectedNames);
  });

  it("should call trackUtilsService.getArtistsNames with correct parameter", () => {
    const artists = [{ name: "Test Artist" }];
    mockTrackUtilsService.getArtistsNames.and.returnValue("Test Artist");

    component.getArtistsNames(artists);

    expect(mockTrackUtilsService.getArtistsNames).toHaveBeenCalledTimes(1);
    expect(mockTrackUtilsService.getArtistsNames).toHaveBeenCalledWith(artists);
  });

  it("should return true when track has valid preview", () => {
    const mockTrack = { id: "1", name: "Test Track", preview_url: "url1" };
    mockTrackUtilsService.hasValidPreview.and.returnValue(true);

    const result = component.hasValidPreview(mockTrack);

    expect(mockTrackUtilsService.hasValidPreview).toHaveBeenCalledWith(
      mockTrack
    );
    expect(result).toBe(true);
  });

  it("should return false when track has no valid preview", () => {
    const mockTrack = { id: "2", name: "Test Track", preview_url: null };
    mockTrackUtilsService.hasValidPreview.and.returnValue(false);

    const result = component.hasValidPreview(mockTrack);

    expect(mockTrackUtilsService.hasValidPreview).toHaveBeenCalledWith(
      mockTrack
    );
    expect(result).toBe(false);
  });

  it("should call trackUtilsService.openSpotify when openSpotify is called", () => {
    const mockTrack = {
      id: "1",
      name: "Test Track",
      external_urls: { spotify: "https://open.spotify.com/track/123" },
    };

    component.openSpotify(mockTrack);

    expect(mockTrackUtilsService.openSpotify).toHaveBeenCalledWith(mockTrack);
  });

  it("should call openSpotify with correct track parameter", () => {
    const track = mockTracks[0];

    component.openSpotify(track);

    expect(mockTrackUtilsService.openSpotify).toHaveBeenCalledTimes(1);
    expect(mockTrackUtilsService.openSpotify).toHaveBeenCalledWith(track);
  });

  it("should get tracks and update component state", () => {
    const mockToken = "mock-access-token";
    const mockIsrcs = component["isrcs"]; // Acessa propriedade privada

    mockTokenService.getAccessToken.and.returnValue(of(mockToken));
    mockSpotfyService.getTracksByIsrcs.and.returnValue(of(mockTracks));

    component["getTracks"]();

    expect(mockTokenService.getAccessToken).toHaveBeenCalled();
    expect(mockAuthService.saveToken).toHaveBeenCalledWith(mockToken);
    expect(mockSpotfyService.getTracksByIsrcs).toHaveBeenCalledWith([
      ...mockIsrcs,
    ]);
    expect(component.tracks).toEqual(mockTracks);
    expect(mockPaginationService.updatePagination).toHaveBeenCalledWith(
      0,
      10,
      mockTracks
    );
  });

  it("should handle error when getting tracks fails", () => {
    const mockError = new Error("API Error");
    spyOn(console, "error");

    mockTokenService.getAccessToken.and.returnValue(of("mock-token"));
    mockSpotfyService.getTracksByIsrcs.and.returnValue(throwError(mockError));

    component["getTracks"]();

    expect(console.error).toHaveBeenCalledWith(
      ">>>>>>>>>>> Erro ao buscar faixas:",
      mockError
    );
  });

  it("should handle notification when res is true", () => {
    spyOn(console, "log");
    spyOn(component as any, "handleLastPagination");

    component["handleNotification"](true);

    expect(console.log).toHaveBeenCalledWith(
      "Notification received, updating track list...",
      true
    );
    expect(component.activePaginator).toBe(true);
    expect(component["handleLastPagination"]).toHaveBeenCalled();
  });

  it("should handle notification when res is false", () => {
    spyOn(console, "log");
    component.tracks = mockTracks;

    component["handleNotification"](false);

    expect(console.log).toHaveBeenCalledWith(
      "Notification received, updating track list...",
      false
    );
    expect(component.activePaginator).toBe(false);
    expect(mockPaginationService.setPageSize).toHaveBeenCalledWith(
      mockTracks.length,
      mockTracks
    );
  });

  it("should call setPageSize with correct parameters when res is false", () => {
    const testTracks = [{ id: "1" }, { id: "2" }, { id: "3" }];
    component.tracks = testTracks;

    component["handleNotification"](false);

    expect(mockPaginationService.setPageSize).toHaveBeenCalledWith(
      3,
      testTracks
    );
  });

  it("should handle last pagination with existing pageSize", () => {
    component["lastPagination"] = 15;
    component.tracks = mockTracks;

    component["handleLastPagination"]();

    expect(component["lastPagination"]).toBe(15);
    expect(mockPaginationService.setPageSize).toHaveBeenCalledWith(
      15,
      mockTracks
    );
  });

  it("should handle last pagination with default pageSize when lastPagination is 0", () => {
    component["lastPagination"] = 0;
    component.tracks = mockTracks;

    component["handleLastPagination"]();

    expect(component["lastPagination"]).toBe(5);
    expect(mockPaginationService.setPageSize).toHaveBeenCalledWith(
      5,
      mockTracks
    );
  });

  it("should call setPageSize with correct tracks array", () => {
    const testTracks = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];
    component.tracks = testTracks;
    component["lastPagination"] = 10;

    component["handleLastPagination"]();

    expect(mockPaginationService.setPageSize).toHaveBeenCalledWith(
      10,
      testTracks
    );
  });

  it("should return full artists names when 2 or fewer artists", () => {
    const mockArtists = [{ name: "Artist 1" }, { name: "Artist 2" }];
    const expectedNames = "Artist 1, Artist 2";
    mockTrackUtilsService.getArtistsNames.and.returnValue(expectedNames);

    const result = component.getTruncatedArtists(mockArtists);

    expect(mockTrackUtilsService.getArtistsNames).toHaveBeenCalledWith(
      mockArtists
    );
    expect(result).toBe(expectedNames);
  });

  it("should return truncated artists names when more than 2 artists", () => {
    const mockArtists = [
      { name: "Artist 1" },
      { name: "Artist 2" },
      { name: "Artist 3" },
      { name: "Artist 4" },
    ];

    const result = component.getTruncatedArtists(mockArtists);

    expect(result).toBe("Artist 1, Artist 2");
    expect(mockTrackUtilsService.getArtistsNames).not.toHaveBeenCalled();
  });

  it("should handle single artist correctly", () => {
    const mockArtists = [{ name: "Solo Artist" }];
    const expectedNames = "Solo Artist";
    mockTrackUtilsService.getArtistsNames.and.returnValue(expectedNames);

    const result = component.getTruncatedArtists(mockArtists);

    expect(mockTrackUtilsService.getArtistsNames).toHaveBeenCalledWith(
      mockArtists
    );
    expect(result).toBe(expectedNames);
  });

  it("should format artists tooltip with numbered list", () => {
    const mockArtists = [
      { name: "Artist 1" },
      { name: "Artist 2" },
      { name: "Artist 3" },
    ];
    const expected = "1. Artist 1\n2. Artist 2\n3. Artist 3";

    const result = component.getArtistsTooltip(mockArtists);

    expect(result).toBe(expected);
  });

  it("should handle single artist in tooltip", () => {
    const mockArtists = [{ name: "Solo Artist" }];
    const expected = "1. Solo Artist";

    const result = component.getArtistsTooltip(mockArtists);

    expect(result).toBe(expected);
  });

  it("should handle empty artists array", () => {
    const mockArtists: any[] = [];
    const expected = "";

    const result = component.getArtistsTooltip(mockArtists);

    expect(result).toBe(expected);
  });

  it("should format multiple artists with correct numbering", () => {
    const mockArtists = [
      { name: "First Artist" },
      { name: "Second Artist" },
      { name: "Third Artist" },
      { name: "Fourth Artist" },
    ];
    const expected =
      "1. First Artist\n2. Second Artist\n3. Third Artist\n4. Fourth Artist";

    const result = component.getArtistsTooltip(mockArtists);

    expect(result).toBe(expected);
  });

  it("should return paginated data when paginationState exists", () => {
    const mockPaginatedData = [
      { id: "1", name: "Track 1" },
      { id: "2", name: "Track 2" },
    ];

    component.paginationState = {
      pageIndex: 0,
      pageSize: 10,
      totalItems: 2,
      paginatedData: mockPaginatedData,
    };

    const result = component.paginateData;

    expect(result).toEqual(mockPaginatedData);
  });

  it("should return empty array when paginationState is null", () => {
    component.paginationState = null as any;

    const result = component.paginateData;

    expect(result).toEqual([]);
  });

  it("should return empty array when paginationState is undefined", () => {
    component.paginationState = undefined as any;

    const result = component.paginateData;

    expect(result).toEqual([]);
  });

  it("should return empty array when paginatedData is null", () => {
    component.paginationState = {
      pageIndex: 0,
      pageSize: 10,
      totalItems: 0,
      paginatedData: null as any,
    };

    const result = component.paginateData;

    expect(result).toEqual([]);
  });
});
