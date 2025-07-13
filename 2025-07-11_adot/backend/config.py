from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import boto3
import json
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    # Database Configuration
    database_url: Optional[str] = Field(default=None, description="Database URL")
    db_host: Optional[str] = Field(default=None, description="Database host")
    db_port: int = Field(default=5432, description="Database port")
    db_name: str = Field(default="adotdb", description="Database name")
    db_username: Optional[str] = Field(default=None, description="Database username")
    db_password: Optional[str] = Field(default=None, description="Database password")
    
    # AWS Configuration
    aws_region: str = Field(default="ap-northeast-1", description="AWS region")
    db_secret_arn: Optional[str] = Field(default=None, description="Database secret ARN")
    
    # Application Configuration
    app_name: str = Field(default="ADOT Todo API", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    debug: bool = Field(default=False, description="Debug mode")
    
    def get_database_url(self) -> str:
        """Get database URL from various sources"""
        if self.database_url:
            return self.database_url
        
        # Try to get credentials from AWS Secrets Manager
        if self.db_secret_arn:
            try:
                secrets_client = boto3.client('secretsmanager', region_name=self.aws_region)
                response = secrets_client.get_secret_value(SecretId=self.db_secret_arn)
                secret = json.loads(response['SecretString'])
                
                return f"postgresql+asyncpg://{secret['username']}:{secret['password']}@{secret['host']}:{secret.get('port', 5432)}/{secret.get('dbname', self.db_name)}"
            except Exception as e:
                logger.warning(f"Failed to retrieve database credentials from Secrets Manager: {e}")
        
        # Fallback to environment variables or defaults
        if self.db_host and self.db_username and self.db_password:
            return f"postgresql+asyncpg://{self.db_username}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
        
        # Development fallback to SQLite
        logger.info("Using SQLite database for development")
        return "sqlite+aiosqlite:////tmp/todos.db"


settings = Settings()