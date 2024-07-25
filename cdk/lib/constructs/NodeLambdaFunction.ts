import { IRole, ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { LambdaConfiguration } from "../../helpers/lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { FunctionUrlAuthType, HttpMethod, IFunctionUrl, InvokeMode } from "aws-cdk-lib/aws-lambda";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

export interface NodeLambdaFunctionProps extends NodejsFunctionProps {
  Url?:{
    enabled: boolean;
    cors?: boolean;
    public?: boolean;
    sreaming?: boolean;
  }
}
export class NodeLambdaFunction extends NodejsFunction {
  readonly functionUrl: IFunctionUrl
  constructor(scope: Construct, id: string, props: NodeLambdaFunctionProps) {
   
    const lambdaFunctionRole = new Role(scope, `${id}Role`, { 
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole') ]
     });

     super(scope, id, {
      entry: props.entry,
      role: lambdaFunctionRole,
      ...LambdaConfiguration,
      ...props,
      bundling: {
        ...LambdaConfiguration.bundling,
        ...props.bundling
      },
      environment: props.environment
    });

    new LogGroup(scope, `${id}LogGroup`, {
      logGroupName: `/aws/lambda/${this.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY
    });

    if(props.Url?.enabled) {
      this.functionUrl = this.addFunctionUrl({
        invokeMode: props.Url.sreaming ? 
          InvokeMode.RESPONSE_STREAM: 
          InvokeMode.BUFFERED,
        authType: props.Url.public ? 
          FunctionUrlAuthType.NONE : 
          FunctionUrlAuthType.AWS_IAM,
        cors: props.Url.cors ? {
            allowCredentials: true,
            allowedHeaders: ['*'],
            allowedMethods: [ HttpMethod.ALL ],
            allowedOrigins: [ '*' ],
            maxAge: Duration.days(1),
        } : undefined,
      });
    }
  }
}