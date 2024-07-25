import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Distribution, CachePolicy, HttpVersion, ViewerProtocolPolicy, OriginRequestPolicy, CfnOriginAccessControl, CfnDistribution, AllowedMethods } from 'aws-cdk-lib/aws-cloudfront';
import { FunctionUrlOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { join } from 'path';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LambdaConfiguration } from '../helpers/lambda';
import { NodeLambdaFunction } from './constructs/NodeLambdaFunction';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';

export class ApiLambdaUrlStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { account: accountId } = Stack.of(this);

    const table = new Table(this, 'example-table', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
    });

    const fn = new NodeLambdaFunction(this, 'example-lambda', {
      entry: join(process.cwd(), '../src/handler/index.ts'),
      ...LambdaConfiguration,
      Url: { enabled: true },
      environment: {
        TABLE_NAME: table.tableName,
      }
    });

    table.grantReadWriteData(fn);

    const lambdaOriginAccessControl = new CfnOriginAccessControl(this, 'LambdaUrlOAC', {
      originAccessControlConfig: {
          name: `Lambda-URL-OAC`,
          originAccessControlOriginType: 'lambda',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
      },
    });
    
    const distribution = new Distribution(this, `CloudFrontDistribution`, {
      defaultBehavior: {
        origin: new FunctionUrlOrigin(fn.functionUrl),
        cachePolicy: CachePolicy.CACHING_DISABLED,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
      },
      httpVersion: HttpVersion.HTTP2_AND_3,
    });

    fn.functionUrl.grantInvokeUrl(new ServicePrincipal('cloudfront.amazonaws.com', {
      conditions: {
          ArnLike: {
              'aws:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/${distribution.distributionId}`,
          },
          StringEquals: {
              'aws:SourceAccount': accountId,
          },
      }
    }));

    const cfCfnDist = distribution.node.defaultChild as CfnDistribution;
    cfCfnDist.addPropertyOverride(
        'DistributionConfig.Origins.0.OriginAccessControlId',
        lambdaOriginAccessControl.getAtt('Id')
    );
  }
}