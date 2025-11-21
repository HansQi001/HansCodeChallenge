# 📂 Project Name

## 🚀 Overview
This project is a full-stack web application built with:
- **Frontend:** jQuery + JavaScript for dynamic UI interactions
- **Backend:** ASP.NET Core MVC & WebAPI in C#
- **Architecture:** RESTful APIs with clean separation of concerns

The application demonstrates robust file handling, responsive UI components, and scalable backend services.

---

## 🛠️ Tech Stack
- **Frontend:** jQuery, JavaScript, HTML5, CSS3
- **Backend:** .NET Core MVC, WebAPI, C#

---

## 📦 Installation

### Prerequisites
- .NET 8+ SDK
### Steps
```bash
# Clone the repository
git clone https://github.com/HansQi001/HansCodeChallenge.git
cd HansCodeChallenge/HansCodeChallenge.VideoWebApp

# Restore backend dependencies
dotnet restore

# Run the backend
dotnet run --launch-profile https

# Open the link with Chrome
https://localhost:7072/
``` 

### About the code
## 🧭 Controllers & Actions

- **HomeController**
  - Provides the landing page and static views
  - Handles navigation to the main UI

- **VideoController**
  - Supports video upload with validation
  - Streams and plays uploaded videos
  - Exposes RESTful endpoints for video management

### 🎬 Video Playback Actions
- **StreamAudio**
  - Provides video/audio streaming support
  - Relies on built‑in framework streaming capabilities

- **ChunkVideo**
  - Provides the same playback function as `StreamAudio`
  - Implements manual range processing for finer control over byte ranges
  - Useful for debugging, custom buffering, or scenarios where native streaming needs to be extended

### 📤 Video Upload Logic

- **UploadVideo Action**
  - Provides the video upload service
  - Decorated with `[RequestSizeLimit(200_000_000)]` to enforce a 200 MB limit
  - Ensures that even if the global setting allows large uploads, this action explicitly restricts the size

### ⚙️ Global vs Action-Level Limits
- In `Program.cs`, the global multipart body length is configured:
  ```csharp
  builder.Services.Configure<FormOptions>(options =>
  {
      options.MultipartBodyLengthLimit = defaultSize; // 200 MB
  });
  ```

### 📁 Video List Retrieval & Performance Considerations

- **GetVideoList Action**
  - Returns all uploaded video files from the server's storage folder
  - Works efficiently when the number of files is small
  - ⚠️ **However, as more videos are uploaded, this action may become a performance bottleneck** because:
    - It performs repeated directory scanning
    - Each request triggers new file system operations
    - Large directories increase I/O cost significantly

#### 🚀 Improving Performance with Caching

To avoid scanning the directory on every request, caching can be introduced:

- Cache the list of video metadata (file name, size, upload time, etc.)
- Refresh the cache only when:
  - A file is added
  - A file is deleted
  - A timed expiration is reached (e.g., 30 seconds)

Using a caching layer (e.g., **IMemoryCache** in ASP.NET Core) helps to:
- Reduce disk access
- Improve response speed
- Scale better with growing numbers of uploaded files

Caching makes the video list retrieval significantly more efficient when handling many files.
