using Microsoft.AspNetCore.Mvc;

namespace HansCodeChallenge.VideoWebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VideosController : ControllerBase
    {
        private static readonly string folderPath
            = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "videos");

        [HttpGet("list")]
        public IActionResult GetVideoList()
        {
            if (!Directory.Exists(folderPath))
            {
                return NotFound("Video directory not found.");
            }

            string[]? videoFiles = null;

            try
            {
                videoFiles = Directory.GetFiles(folderPath, "*.mp4");
            }
            catch (UnauthorizedAccessException)
            {
                Console.WriteLine($"Error: Access to '{folderPath}' is denied.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An unexpected error occurred: {ex.Message}");
            }

            var videos = videoFiles?.Select((filePath, index) => new
            {
                Title = Path.GetFileNameWithoutExtension(filePath),
                Size = (new FileInfo(filePath)).Length / (1024 * 1024),
            }).ToArray() ?? Array.Empty<object>();

            return Ok(videos);
        }

        [HttpPost("upload")]
        [RequestSizeLimit(200 * 1024 * 1024)] // Limit upload size to ~200MB
        public async Task<IActionResult> UploadVideo([FromForm] List<IFormFile> videoFiles)
        {
            if (videoFiles == null || videoFiles.Count == 0)
            {
                return BadRequest("No file uploaded.");
            }

            if (videoFiles.Any(f => !f.ContentType.Equals("video/mp4")))
            {
                return BadRequest("Invalid file type. Only .mp4 files are allowed.");
            }
            // Save the file to a storage location
            foreach (var file in videoFiles)
            {
                // avoid to save the file with name like "../../file.mp4" into unexpected location
                var safeFileName = Path.GetFileName(file.FileName);

                var filePath = Path.Combine(folderPath, safeFileName);

                try
                {
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, $"Got an error when saving the file {safeFileName}, error: {ex.Message}");
                }
            }

            // return success message and saved files' names
            return Ok(new
            {
                message = "Video uploaded successfully.",
                files = videoFiles.Select(f => new
                {
                    name = Path.GetFileName(f.FileName),
                    size = f.Length
                })
            });
        }

        [HttpGet("stream/{fileName}")]
        public IActionResult StreamAudio(string fileName)
        {
            var filePath = Path.Combine(folderPath, fileName);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Video not found.");
            }

            var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);

            return new FileStreamResult(fs, "video/mp4")
            {
                EnableRangeProcessing = true
            };
        }

        [HttpGet("chunk/{fileName}")]
        public IActionResult ChunkVideo(string fileName)
        {
            if (!Request.Headers.ContainsKey("Range"))
                return BadRequest("Range header is missing.");

            var filePath = Path.Combine(folderPath, fileName);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Video not found.");
            }

            var fileLength = new FileInfo(filePath).Length;

            var rangeHeader = Request.Headers["Range"].ToString();
            var range = rangeHeader.Replace("bytes=", "").Split('-');
            long start = long.Parse(range[0]);
            long end = (range.Length > 1 && !string.IsNullOrEmpty(range[1]))
                ? long.Parse(range[1])
                : Math.Min(start + 1024 * 1024 - 1, fileLength - 1);

            var contentLength = end - start + 1;

            var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            fs.Seek(start, SeekOrigin.Begin);

            Response.StatusCode = StatusCodes.Status206PartialContent;
            Response.Headers.Append("Content-Range", $"bytes {start}-{end}/{fileLength}");
            Response.Headers.Append("Accept-Ranges", "bytes");
            Response.Headers.Append("Content-Length", contentLength.ToString());

            return File(fs, "video/mp4", enableRangeProcessing: false);
        }

    }
}
