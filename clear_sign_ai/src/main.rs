use actix_web::{post, web, App, HttpResponse, HttpServer, Responder};
use dotenv::from_filename;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::env;
use std::path::PathBuf;
use reqwest::Client;

#[derive(Deserialize)]
struct InputData {
    contract_address: String,
    abi: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct ClaudeRequest {
    prompt: String,
    max_tokens_to_sample: usize,
    temperature: f64,
    model: String,
    stop_sequences: Vec<String>,
}

#[derive(Deserialize)]
struct ClaudeResponse {
    completion: Option<String>,
    completion_reason: Option<String>,
    stop: Option<String>,
    model: Option<String>,
    truncated: Option<bool>,
    exception: Option<String>,
    // Include other fields if necessary
}

#[post("/clear-sign-ai")]
async fn clear_sign_ai_endpoint(data: web::Json<InputData>) -> impl Responder {
    // Environment variables are already loaded in main(), no need to load them here

    // Ensure CLAUDE_API_KEY is set
    let claude_api_key = match env::var("CLAUDE_API_KEY") {
        Ok(key) => key,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .body("CLAUDE_API_KEY environment variable not set");
        }
    };

    // Ensure ETHERSCAN_API_KEY is set if needed
    if data.abi.is_none() && env::var("ETHERSCAN_API_KEY").is_err() {
        return HttpResponse::InternalServerError()
            .body("ETHERSCAN_API_KEY environment variable not set");
    }

    // Fetch ABI if not provided
    let abi = match &data.abi {
        Some(abi) => abi.clone(),
        None => match fetch_abi_from_etherscan(&data.contract_address).await {
            Ok(abi) => abi,
            Err(err) => {
                return HttpResponse::InternalServerError()
                    .body(format!("Error fetching ABI: {}", err));
            }
        },
    };

    // Extract function information
    let functions_info = extract_functions_info(&abi);

    // Create prompt for the AI
    let prompt = create_prompt(&functions_info, &data.contract_address, &abi);

    // Call Claude API
    match call_claude_api(&prompt, &claude_api_key).await {
        Ok(response_markdown) => {
            // Return the Markdown as a JSON response
            let response_json = json!({ "markdown": response_markdown });
            HttpResponse::Ok()
                .content_type("application/json")
                .json(response_json)
        }
        Err(err) => HttpResponse::InternalServerError().body(format!("Error: {}", err)),
    }
}

async fn fetch_abi_from_etherscan(contract_address: &str) -> Result<serde_json::Value, String> {
    let etherscan_api_key = env::var("ETHERSCAN_API_KEY")
        .map_err(|_| "ETHERSCAN_API_KEY environment variable not set".to_string())?;

    let url = format!(
        "https://api.etherscan.io/api?module=contract&action=getabi&address={}&apikey={}",
        contract_address, etherscan_api_key
    );

    let client = Client::new();
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch ABI: {}", e))?;

    let resp_json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse ABI response: {}", e))?;

    if resp_json["status"] == "1" {
        let abi_str = resp_json["result"]
            .as_str()
            .ok_or("Invalid ABI response format")?;
        let abi_json: serde_json::Value = serde_json::from_str(abi_str)
            .map_err(|e| format!("Failed to parse ABI JSON: {}", e))?;
        Ok(abi_json)
    } else {
        Err(resp_json["result"]
            .as_str()
            .unwrap_or("Unknown error fetching ABI")
            .to_string())
    }
}

fn extract_functions_info(abi: &serde_json::Value) -> Vec<String> {
    let mut functions = Vec::new();
    let empty_vec = Vec::new();

    if let Some(items) = abi.as_array() {
        for item in items {
            if item["type"] == "function" {
                let name = item["name"].as_str().unwrap_or("");
                let inputs = item["inputs"].as_array().unwrap_or(&empty_vec);
                let params: Vec<String> = inputs
                    .iter()
                    .map(|input| {
                        let typ = input["type"].as_str().unwrap_or("");
                        let name = input["name"].as_str().unwrap_or("");
                        format!("{} {}", typ, name)
                    })
                    .collect();
                let function_signature = format!("{}({})", name, params.join(", "));
                functions.push(function_signature);
            }
        }
    }
    functions
}

fn create_prompt(
    functions: &Vec<String>,
    contract_address: &str,
    abi: &serde_json::Value,
) -> String {
    let abi_str = serde_json::to_string_pretty(abi).unwrap_or_else(|_| "".to_string());

    let mut prompt = String::new();
    prompt.push_str("You are an AI assistant that helps developers by generating detailed EIP-712 and EIP-7730 specifications and developer documentation for Ethereum smart contracts.\n\n");
    prompt.push_str("Please provide a comprehensive Markdown document that includes the following sections:\n");
    prompt.push_str("1. **Contract Overview**: A brief description of the smart contract at address ");
    prompt.push_str(contract_address);
    prompt.push_str(".\n");
    prompt.push_str("2. **ABI Specification**: An explanation of the ABI provided.\n");
    prompt.push_str("3. **Function Descriptions**: Detailed descriptions of each function, including parameters and expected behavior.\n");
    prompt.push_str("4. **EIP-712 Specification**: A complete EIP-712 specification for signing messages related to this contract.\n");
    prompt.push_str("5. **EIP-7730 Specification**: A detailed EIP-7730 specification for clear signing of transactions.\n");
    prompt.push_str("6. **Usage Examples**: Code snippets in Solidity and JavaScript demonstrating how to interact with the contract.\n");
    prompt.push_str("7. **Security Considerations**: Any potential security risks or best practices.\n\n");
    prompt.push_str("Here is the ABI and function list for reference:\n\n");
    prompt.push_str("**ABI**:\n");
    prompt.push_str("```json\n");
    prompt.push_str(&abi_str);
    prompt.push_str("\n```\n\n");
    prompt.push_str("**Functions**:\n");
    for func in functions {
        prompt.push_str("- `");
        prompt.push_str(func);
        prompt.push_str("`\n");
    }
    prompt.push_str("\nPlease ensure the Markdown document is well-formatted, with appropriate code blocks, headings, and bullet points. Use clear and concise language suitable for developers.\n");

    prompt
}

async fn call_claude_api(prompt: &str, api_key: &str) -> Result<String, String> {
    let client = Client::new();

    let claude_request = json!({
        "prompt": prompt,
        "max_tokens_to_sample": 3000,
        "temperature": 0.7,
        "model": "claude-2",
        "stop_sequences": ["\n\n"]
    });

    let response = client
        .post("https://api.anthropic.com/v1/complete")
        .header("x-api-key", api_key)
        .header("Content-Type", "application/json")
        .json(&claude_request)
        .send()
        .await
        .map_err(|e| format!("Failed to call Claude API: {}", e))?;

    let status = response.status();

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read Claude API response: {}", e))?;

    // Add the print statement here
    println!("Claude API response: {}", response_text);

    if !status.is_success() {
        return Err(format!(
            "Claude API returned error status {}: {}",
            status, response_text
        ));
    }

    let response_json: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|e| format!("Failed to parse Claude API response: {}", e))?;

    // Check for 'completion' field in the response
    if let Some(completion) = response_json["completion"].as_str() {
        Ok(completion.to_string())
    } else {
        // Extract error message if available
        let error_message = response_json["error"]["message"]
            .as_str()
            .unwrap_or("Unknown error from Claude API")
            .to_string();
        Err(format!(
            "Invalid response from Claude API: 'completion' field missing. Error message: {}",
            error_message
        ))
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables from the parent directory
    let mut env_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    env_path.pop(); // Move up one directory to ETHGlobalSF2024
    env_path.push(".env");
    from_filename(env_path).ok();

    // Optionally, print environment variables to verify they are loaded
    println!("Loaded CLAUDE_API_KEY: {:?}", env::var("CLAUDE_API_KEY"));
    println!("Loaded ETHERSCAN_API_KEY: {:?}", env::var("ETHERSCAN_API_KEY"));

    HttpServer::new(|| App::new().service(clear_sign_ai_endpoint))
        .bind(("0.0.0.0", 8080))?
        .run()
        .await
}