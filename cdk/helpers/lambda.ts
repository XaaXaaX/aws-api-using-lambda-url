import { Duration } from "aws-cdk-lib"
import { Architecture, LoggingFormat, Runtime } from "aws-cdk-lib/aws-lambda"
import { BundlingOptions, NodejsFunctionProps, OutputFormat, SourceMapMode } from "aws-cdk-lib/aws-lambda-nodejs"

export const EsbuildNodeBundling: BundlingOptions = {
  platform: 'node',
  format: OutputFormat.ESM,
  mainFields: ['module', 'main'],
  forceDockerBundling: false,
  minify: true,
  sourceMap: true,
  sourcesContent: false,
  sourceMapMode: SourceMapMode.INLINE,
  metafile: false,
  externalModules: [ '@aws-sdk' ],
}

export const LambdaConfiguration: NodejsFunctionProps = {
  runtime: Runtime.NODEJS_20_X,
  memorySize: 128,
  timeout: Duration.seconds(5),
  awsSdkConnectionReuse: false,
  architecture: Architecture.ARM_64,
  loggingFormat: LoggingFormat.JSON,
  systemLogLevel: 'WARN',
  applicationLogLevel: 'INFO',
  bundling: EsbuildNodeBundling,
}