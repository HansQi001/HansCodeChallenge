using Microsoft.AspNetCore.Http;
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
        public async Task<IActionResult> GetVideoList()
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
                Id = index + 1,
                Title = Path.GetFileNameWithoutExtension(filePath),
                Url = $"/videos/{Path.GetFileName(filePath)}"
            }).ToArray() ?? Array.Empty<object>();

            return Ok(videos);
        }

        [HttpPost("upload")]
        [RequestSizeLimit(200_000_000)] // Limit upload size to ~200MB
        public async Task<IActionResult> UploadVideo([FromForm] List<IFormFile> videoFiles)
        {
            if (videoFiles == null || videoFiles.Count == 0)
            {
                return BadRequest("No file uploaded.");
            }

            if (videoFiles.Any(f => !f.FileName.EndsWith("mp4")))
            {
                return BadRequest("Invalid file type. Only .mp4 files are allowed.");
            }
            // Save the file to a storage location
            foreach (var file in videoFiles)
            {
                var filePath = Path.Combine(folderPath, file.FileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
            }

            // For demonstration, we'll just return a success message
            return Ok(new { message = "Video uploaded successfully." });
        }
    }
}
