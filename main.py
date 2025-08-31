import requests
import json
import os
from typing import Optional
import base64

class OpenRouterImageGenerator:
    def __init__(self, api_key: str):
        """
        Initialize the OpenRouter image generator.
        
        Args:
            api_key (str): Your OpenRouter API key
        """
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "google/gemini-2.5-flash-image-preview:free"
        
    def generate_image(self, prompt: str, save_path: Optional[str] = None) -> dict:
        """
        Generate an image from a text prompt using OpenRouter.
        
        Args:
            prompt (str): Text description of the image to generate
            save_path (str, optional): Path to save the generated image
            
        Returns:
            dict: Response containing the generated image data
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/your-repo",  # Replace with your actual referer
            "X-Title": "Image Generator App"  # Replace with your app name
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Generate an image based on this description: {prompt}"
                        }
                    ]
                }
            ],
            "max_tokens": 1000
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Always save response for debugging
            with open("response_debug.json", "w") as f:
                json.dump(result, f, indent=2)
            
            # Try to extract and save image data
            self._extract_and_save_image(result, prompt)
                    
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"Error making request: {e}")
            return {"error": str(e)}
        except json.JSONDecodeError as e:
            print(f"Error parsing response: {e}")
            return {"error": f"JSON decode error: {str(e)}"}
    
    def _extract_and_save_image(self, result: dict, prompt: str):
        """
        Extract image data from the API response and save it.
        """
        try:
            if 'choices' in result and len(result['choices']) > 0:
                choice = result['choices'][0]
                
                # Check if there's message with images
                if 'message' in choice and 'images' in choice['message']:
                    images = choice['message']['images']
                    if len(images) > 0:
                        image_data = images[0]
                        
                        if 'type' in image_data and image_data['type'] == 'image_url':
                            if 'image_url' in image_data and 'url' in image_data['image_url']:
                                image_url = image_data['image_url']['url']
                                self._extract_and_save_base64_image(image_url, prompt)
                                return
                
                # Fallback: Check if there's content with image data
                if 'message' in choice and 'content' in choice['message']:
                    content = choice['message']['content']
                    
                    # Look for image data in the content
                    if isinstance(content, list):
                        for item in content:
                            if item.get('type') == 'image_url':
                                image_url = item.get('image_url', {}).get('url')
                                if image_url:
                                    self._extract_and_save_base64_image(image_url, prompt)
                                    return
                    
                    # If no image_url found, check for base64 data
                    elif isinstance(content, str):
                        # Look for base64 encoded images
                        if 'data:image' in content:
                            self._extract_base64_image(content, prompt)
                            return
                
                print("No image data found in response. Check response_debug.json for details.")
                print("Response structure:", json.dumps(result, indent=2))
                
        except Exception as e:
            print(f"Error extracting image: {e}")
    

    
    def _extract_and_save_base64_image(self, image_url: str, prompt: str):
        """
        Extract and save base64 encoded image from the image_url field.
        """
        try:
            # Extract the base64 data (remove the data:image/png;base64, prefix)
            if image_url.startswith('data:image/png;base64,'):
                base64_data = image_url.split(',')[1]
                image_format = 'png'
            elif image_url.startswith('data:image/jpeg;base64,'):
                base64_data = image_url.split(',')[1]
                image_format = 'jpg'
            else:
                base64_data = image_url
                image_format = 'png'  # Default to PNG
            
            # Decode the base64 data
            image_bytes = base64.b64decode(base64_data)
            
            # Create filename from prompt
            filename = f"generated_image_{prompt[:30].replace(' ', '_').replace('/', '_')}.{image_format}"
            
            with open(filename, 'wb') as f:
                f.write(image_bytes)
            
            print(f"✅ Image saved as: {filename}")
            print(f"📁 Full path: {os.path.abspath(filename)}")
            print(f"📊 Image size: {len(image_bytes)} bytes")
            
            # Try to open the image automatically
            self._open_image(filename)
            
        except Exception as e:
            print(f"Error extracting base64 image: {e}")
    
    def _extract_base64_image(self, content: str, prompt: str):
        """
        Extract and save base64 encoded image from content string.
        """
        try:
            # Find base64 data in content
            if 'data:image' in content:
                # Extract the base64 part
                start = content.find('data:image')
                end = content.find('"', start)
                if end == -1:
                    end = len(content)
                
                base64_data = content[start:end]
                
                # Parse the data URL
                if ';base64,' in base64_data:
                    header, data = base64_data.split(';base64,')
                    image_format = header.split(':')[1]
                    
                    # Decode base64
                    image_bytes = base64.b64decode(data)
                    
                    # Determine file extension
                    ext = 'png' if 'png' in image_format else 'jpg'
                    filename = f"generated_image_{prompt[:30].replace(' ', '_').replace('/', '_')}.{ext}"
                    
                    with open(filename, 'wb') as f:
                        f.write(image_bytes)
                    
                    print(f"✅ Image saved as: {filename}")
                    print(f"📁 Full path: {os.path.abspath(filename)}")
                    
                    # Try to open the image automatically
                    self._open_image(filename)
                    
        except Exception as e:
            print(f"Error extracting base64 image: {e}")
    
    def _open_image(self, filename: str):
        """
        Try to open the generated image automatically.
        """
        try:
            import subprocess
            import platform
            
            system = platform.system()
            
            if system == "Windows":
                os.startfile(filename)
            elif system == "Darwin":  # macOS
                subprocess.run(["open", filename])
            elif system == "Linux":
                subprocess.run(["xdg-open", filename])
            else:
                print(f"Please open the image manually: {filename}")
                
        except Exception as e:
            print(f"Could not open image automatically: {e}")
            print(f"Please open manually: {filename}")

def main():
    """
    Main function to demonstrate image generation.
    """
    # API key directly in code
    api_key = "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"
    
    # Initialize the image generator
    generator = OpenRouterImageGenerator(api_key)
    
    print("OpenRouter Image Generator")
    print("=" * 40)
    print(f"Using model: {generator.model}")
    print()
    
    # Interactive mode
    print("Enter your own prompts (type 'quit' to exit)")
    
    while True:
        user_prompt = input("\nEnter image description: ").strip()
        
        if user_prompt.lower() in ['quit', 'exit', 'q']:
            break
            
        if user_prompt:
            print(f"Generating: {user_prompt}")
            result = generator.generate_image(user_prompt)
            
            if "error" in result:
                print(f"Error: {result['error']}")
            else:
                print("Request sent successfully!")
                print("Check response_debug.json for response details")

if __name__ == "__main__":
    main()