# VoiceStudio

A desktop application that runs Text-To-Speech (TTS) models locally on your device, without requiring an internet connection or sending your data to external servers.

## Description

This application allows you to run various Text-To-Speech models directly on your computer. It provides a simple interface to convert text to natural-sounding speech using state-of-the-art AI models while maintaining your privacy by processing everything locally.

## Note

This repository contains only the UI part of the application. To update the container running the actual models, please refer to the [VoiceStudio Models Library](https://github.com/dataX-ai/voice-studio-models-library).

## Local Setup

### Prerequisites

- Run the [VoiceStudio Backend](https://github.com/dataX-ai/voice-studio-models-library) repository at localhost:8000:

### Installation and Running

1. Install dependencies:
   ```
   npm i
   ```

2. Start the application:
   ```
   npm start
   ```

3. To build the application:
   ```
   npm run make
   ```

## Supported Models

| Model | Windows | Ubuntu/Debian | MacOS | Link |
|:-----:|:-------:|:-------------:|:-----:|:----:|
| hexgrad/Kokoro-82M | ✅ | ✅ | ❌ | [Hugging Face](https://huggingface.co/hexgrad/Kokoro-82M) |

## Installation

*Installation instructions will go here*

## Usage

*Usage instructions will go here*

## Development

*Development setup instructions will go here*

## License

*License information will go here*

## Acknowledgements

- [Hugging Face](https://huggingface.co/) for hosting the models
- All the model creators for their incredible work 