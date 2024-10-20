use actix_web::{post, web, App, HttpResponse, HttpServer, Responder};
use dotenv::from_filename;
use reqwest::Client;
use serde_json::json;
use std::env;
use std::path::PathBuf;

#[derive(serde::Deserialize)]
struct InputData {
    contract_address: String,
    abi: Option<serde_json::Value>,
}

struct FunctionInfo {
    name: String,
    inputs: Vec<(String, String)>, // (type, name)
    outputs: Vec<String>,          // types
}

#[post("/clear-sign-ai")]
async fn clear_sign_ai_endpoint(data: web::Json<InputData>) -> impl Responder {
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

fn extract_functions_info(abi: &serde_json::Value) -> Vec<FunctionInfo> {
    let mut functions = Vec::new();
    let empty_vec = Vec::new();

    if let Some(items) = abi.as_array() {
        for item in items {
            if item["type"] == "function" {
                let name = item["name"].as_str().unwrap_or("").to_string();
                let inputs = item["inputs"].as_array().unwrap_or(&empty_vec);
                let params: Vec<(String, String)> = inputs
                    .iter()
                    .map(|input| {
                        let typ = input["type"].as_str().unwrap_or("").to_string();
                        let name = input["name"].as_str().unwrap_or("").to_string();
                        (typ, name)
                    })
                    .collect();
                let outputs = item["outputs"].as_array().unwrap_or(&empty_vec);
                let return_types: Vec<String> = outputs
                    .iter()
                    .map(|output| {
                        let typ = output["type"].as_str().unwrap_or("").to_string();
                        typ
                    })
                    .collect();
                functions.push(FunctionInfo {
                    name,
                    inputs: params,
                    outputs: return_types,
                });
            }
        }
    }
    functions
}

fn create_prompt(
    functions: &Vec<FunctionInfo>,
    contract_address: &str,
    abi: &serde_json::Value,
) -> String {
    let abi_str = serde_json::to_string_pretty(abi).unwrap_or_else(|_| "".to_string());

    let mut prompt = String::new();
    prompt.push_str("You are an AI assistant that helps developers by generating detailed documentation for Ethereum smart contracts.\n\n");
    prompt.push_str("Please provide a comprehensive Markdown document for the smart contract at address ");
    prompt.push_str(contract_address);
    prompt.push_str(" that includes the following sections:\n");
    prompt.push_str("1. **Contract Overview**: A brief description of the smart contract based on its functions.\n");
    prompt.push_str("2. **Function Descriptions**: Detailed descriptions of each function provided below, including parameters, expected behavior, and any return values.\n");
    prompt.push_str("3. **Usage Examples**: Code snippets in Solidity and JavaScript demonstrating how to interact with the contract.\n");
    prompt.push_str("4. **Security Considerations**: Any potential security risks or best practices.\n\n");
    prompt.push_str("Here are the functions with their details for reference:\n\n");
    prompt.push_str("**Functions**:\n");

    for func in functions {
        prompt.push_str("- Function Name: `");
        prompt.push_str(&func.name);
        prompt.push_str("`\n");
        prompt.push_str("  - Parameters:\n");
        if func.inputs.is_empty() {
            prompt.push_str("    - None\n");
        } else {
            for (typ, name) in &func.inputs {
                prompt.push_str("    - `");
                prompt.push_str(typ);
                prompt.push_str(" ");
                prompt.push_str(name);
                prompt.push_str("`\n");
            }
        }
        prompt.push_str("  - Returns:\n");
        if func.outputs.is_empty() {
            prompt.push_str("    - None\n");
        } else {
            for typ in &func.outputs {
                prompt.push_str("    - `");
                prompt.push_str(typ);
                prompt.push_str("`\n");
            }
        }
    }

    prompt.push_str("\nHere is the ABI of the contract for reference:\n\n");
    prompt.push_str("```json\n");
    prompt.push_str(&abi_str);
    prompt.push_str("\n```\n\n");
    prompt.push_str("Please use the ABI and function details provided to generate the documentation. If any information is missing or unclear, please make reasonable assumptions and proceed. **Do not mention any lack of information in your response.**\n");

    prompt
}

async fn call_claude_api(prompt: &str, api_key: &str) -> Result<String, String> {
    let client = Client::new();

    // Prepare the prompt with the required formatting
    let formatted_prompt = format!(
        "{}\n\nHuman: {}\n\nAssistant:",
        "", // Optional system prompt can be placed here
        prompt
    );

    let claude_request = json!({
        "model": "claude-2", // Replace with a model you have access to if necessary
        "prompt": formatted_prompt,
        "max_tokens_to_sample": 3000,
        "temperature": 0.7,
        // Include other parameters as needed
    });

    let response = client
        .post("https://api.anthropic.com/v1/complete")
        .header("x-api-key", api_key)
        .header("Content-Type", "application/json")
        .header("anthropic-version", "2023-06-01")
        .json(&claude_request)
        .send()
        .await
        .map_err(|e| format!("Failed to call Claude API: {}", e))?;

    let status = response.status();

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read Claude API response: {}", e))?;

    // Print the response for debugging
    println!("Claude API response: {}", response_text);

    if !status.is_success() {
        return Err(format!(
            "Claude API returned error status {}: {}",
            status, response_text
        ));
    }

    let response_json: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|e| format!("Failed to parse Claude API response: {}", e))?;

    // Extract the assistant's reply from the response
    if let Some(completion) = response_json["completion"].as_str() {
        Ok(completion.trim().to_string())
    } else {
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
    env_path.pop(); // Move up one directory
    env_path.push(".env");
    from_filename(env_path).ok();

    // Optionally, print environment variables to verify they are loaded
    println!("Loaded CLAUDE_API_KEY: {:?}", env::var("CLAUDE_API_KEY"));
    println!(
        "Loaded ETHERSCAN_API_KEY: {:?}",
        env::var("ETHERSCAN_API_KEY")
    );

    HttpServer::new(|| App::new().service(clear_sign_ai_endpoint))
        .bind(("0.0.0.0", 8080))?
        .run()
        .await
}