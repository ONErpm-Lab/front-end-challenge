public class Album
{
    public string album_type { get; set; } = string.Empty;
    public List<Artist> artists { get; set; } = new();
    public List<string> available_markets { get; set; } = new();
    public ExternalUrls external_urls { get; set; } = new();
    public string href { get; set; } = string.Empty;
    public string id { get; set; } = string.Empty;
    public List<Image> images { get; set; } = new();
    public string name { get; set; } = string.Empty;
    public string release_date { get; set; } = string.Empty;
    public string release_date_precision { get; set; } = string.Empty;
    public int total_tracks { get; set; }
    public string type { get; set; } = string.Empty;
    public string uri { get; set; } = string.Empty;
}

public class Artist
{
    public ExternalUrls external_urls { get; set; } = new();
    public string href { get; set; } = string.Empty;
    public string id { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
    public string type { get; set; } = string.Empty;
    public string uri { get; set; } = string.Empty;
}

public class ExternalIds
{
    public string isrc { get; set; } = string.Empty;
}

public class ExternalUrls
{
    public string spotify { get; set; } = string.Empty;
}

public class Image
{
    public int height { get; set; }
    public string url { get; set; } = string.Empty;
    public int width { get; set; }
}

public class Item
{
    public Album album { get; set; } = new();
    public List<Artist> artists { get; set; } = new();
    public List<string> available_markets { get; set; } = new();
    public int disc_number { get; set; }
    public int duration_ms { get; set; }
    public bool @explicit { get; set; }
    public ExternalIds external_ids { get; set; } = new();
    public ExternalUrls external_urls { get; set; } = new();
    public string href { get; set; } = string.Empty;
    public string id { get; set; } = string.Empty;
    public bool is_local { get; set; }
    public string name { get; set; } = string.Empty;
    public int popularity { get; set; }
    public string preview_url { get; set; } = string.Empty;
    public int track_number { get; set; }
    public string type { get; set; } = string.Empty;
    public string uri { get; set; } = string.Empty;
}

public class Root
{
    public Tracks tracks { get; set; } = new();
}

public class Tracks
{
    public string href { get; set; } = string.Empty;
    public List<Item> items { get; set; } = new();
    public int limit { get; set; }
    public object next { get; set; } = new();
    public int offset { get; set; }
    public object previous { get; set; } = new();
    public int total { get; set; }
}