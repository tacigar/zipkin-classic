const {SPAN_V1} = require('../js/spanConverter');

// endpoints from zipkin2.TestObjects
const frontend = {
  serviceName: 'frontend',
  ipv4: '127.0.0.1',
  port: 8080
};

const backend = {
  serviceName: 'backend',
  ipv4: '192.168.99.101',
  port: 9000
};

describe('SPAN v1 Conversion', () => {
  // originally zipkin2.v1.SpanConverterTest.client
  it('converts client span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'CLIENT',
      timestamp: 1472470996199000,
      duration: 207000,
      localEndpoint: frontend,
      remoteEndpoint: backend,
      annotations: [
        {
          value: 'ws',
          timestamp: 1472470996238000
        },
        {
          value: 'wr',
          timestamp: 1472470996403000
        }
      ],
      tags: {
        'http.path': '/api',
        'clnt/finagle.version': '6.45.0',
      }
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [
        {
          value: 'cs',
          timestamp: 1472470996199000,
          endpoint: frontend
        },
        {
          value: 'ws',
          timestamp: 1472470996238000, // ts order retained
          endpoint: frontend
        },
        {
          value: 'wr',
          timestamp: 1472470996403000,
          endpoint: frontend
        },
        {
          value: 'cr',
          timestamp: 1472470996406000,
          endpoint: frontend
        }
      ],
      binaryAnnotations: [
        {
          key: 'http.path',
          value: '/api',
          endpoint: frontend
        },
        {
          key: 'clnt/finagle.version',
          value: '6.45.0',
          endpoint: frontend
        },
        {
          key: 'sa',
          value: true,
          endpoint: backend
        }
      ]
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.SpanConverterTest.client_unfinished
  it('converts incomplete client span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'CLIENT',
      timestamp: 1472470996199000,
      localEndpoint: frontend,
      annotations: [
        {
          value: 'ws',
          timestamp: 1472470996238000
        }
      ]
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      annotations: [
        {
          value: 'cs',
          timestamp: 1472470996199000,
          endpoint: frontend
        },
        {
          value: 'ws',
          timestamp: 1472470996238000,
          endpoint: frontend
        }
      ],
      binaryAnnotations: [] // prefers empty array to nil
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.client_kindInferredFromAnnotation
  it('infers cr annotation', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      localEndpoint: frontend,
      annotations: [
        {
          value: 'cs',
          timestamp: 1472470996199000
        }
      ]
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [
        {
          value: 'cs',
          timestamp: 1472470996199000,
          endpoint: frontend
        },
        {
          value: 'cr',
          timestamp: 1472470996406000,
          endpoint: frontend
        }
      ],
      binaryAnnotations: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_cr
  it('converts client span reporting remote endpoint with late cr', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'CLIENT',
      localEndpoint: frontend,
      remoteEndpoint: backend,
      annotations: [
        {
          value: 'cr',
          timestamp: 1472470996199000
        }
      ]
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      annotations: [
        {
          value: 'cr',
          timestamp: 1472470996199000,
          endpoint: frontend
        }
      ],
      binaryAnnotations: [
        {
          key: 'sa',
          value: true,
          endpoint: backend
        }
      ]
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_sa
  it('converts late remoteEndpoint to sa', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      remoteEndpoint: backend
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: '', // TODO: check if empty name is needed elsewhere in the codebase still
      annotations: [],
      binaryAnnotations: [
        {
          key: 'sa',
          value: true,
          endpoint: backend
        }
      ]
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.noAnnotationsExceptAddresses
  it('converts when remoteEndpoint exist without kind', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      localEndpoint: frontend,
      remoteEndpoint: backend
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [],
      binaryAnnotations: [
        {key: 'lc', value: '', endpoint: frontend},
        {key: 'sa', value: true, endpoint: backend}
      ]
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.server
  it('converts root server span', () => {
    // let's pretend there was no caller, so we don't set shared flag
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'get',
      kind: 'SERVER',
      localEndpoint: backend,
      remoteEndpoint: frontend,
      timestamp: 1472470996199000,
      duration: 207000,
      tags: {
        'http.path': '/api',
        'finagle.version': '6.45.0'
      }
    };

    const v1 = {
      traceId: '1',
      id: '2',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [
        {
          value: 'sr',
          timestamp: 1472470996199000,
          endpoint: backend
        },
        {
          value: 'ss',
          timestamp: 1472470996406000,
          endpoint: backend
        }
      ],
      binaryAnnotations: [
        {
          key: 'http.path',
          value: '/api',
          endpoint: backend
        },
        {
          key: 'finagle.version',
          value: '6.45.0',
          endpoint: backend
        },
        {
          key: 'ca',
          value: true,
          endpoint: frontend
        }
      ]
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.missingEndpoints
  it('converts span with no endpoints', () => {
    const v2 = {
      traceId: '1',
      parentId: '1',
      id: '2',
      name: 'foo',
      timestamp: 1472470996199000,
      duration: 207000
    };

    const v1 = {
      traceId: '1',
      parentId: '1',
      id: '2',
      name: 'foo',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [],
      binaryAnnotations: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.coreAnnotation
  it('converts v2 span retaining an sr annotation', () => {
    const v2 = {
      traceId: '1',
      parentId: '1',
      id: '2',
      name: 'foo',
      timestamp: 1472470996199000,
      annotations: [
        {
          value: 'cs',
          timestamp: 1472470996199000
        }
      ]
    };

    const v1 = {
      traceId: '1',
      parentId: '1',
      id: '2',
      name: 'foo',
      timestamp: 1472470996199000,
      annotations: [
        {
          value: 'cs',
          timestamp: 1472470996199000
        }
      ],
      binaryAnnotations: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.server_shared_v1_no_timestamp_duration
  it('converts shared server span without writing timestamp and duration', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'SERVER',
      shared: true,
      localEndpoint: backend,
      timestamp: 1472470996199000,
      duration: 207000
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      annotations: [
        {
          value: 'sr',
          timestamp: 1472470996199000,
          endpoint: backend
        },
        {
          value: 'ss',
          timestamp: 1472470996406000,
          endpoint: backend
        }
      ],
      binaryAnnotations: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.server_incomplete_shared
  it('converts incomplete shared server span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'SERVER',
      shared: true,
      localEndpoint: backend,
      timestamp: 1472470996199000
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      annotations: [
        {
          value: 'sr',
          timestamp: 1472470996199000,
          endpoint: backend
        }
      ],
      binaryAnnotations: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_ss
  it('converts late incomplete server span with remote endpoint', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'get',
      kind: 'SERVER',
      localEndpoint: backend,
      remoteEndpoint: frontend,
      annotations: [
        {
          value: 'ss',
          timestamp: 1472470996199000
        }
      ]
    };

    const v1 = {
      traceId: '1',
      id: '2',
      name: 'get',
      annotations: [
        {
          value: 'ss',
          timestamp: 1472470996199000,
          endpoint: backend
        }
      ],
      binaryAnnotations: [
        {
          key: 'ca',
          value: true,
          endpoint: frontend
        }
      ]
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_ca
  it('converts late remote endpoint server span', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      kind: 'SERVER',
      remoteEndpoint: frontend
    };

    const v1 = {
      traceId: '1',
      id: '2',
      name: '', // TODO: check if empty name is needed elsewhere in the codebase still
      annotations: [],
      binaryAnnotations: [
        {
          key: 'ca',
          value: true,
          endpoint: frontend
        }
      ]
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.localSpan_emptyComponent
  it('converts local span', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'local',
      localEndpoint: {serviceName: 'frontend'},
      timestamp: 1472470996199000,
      duration: 207000,
    };

    const v1 = {
      traceId: '1',
      id: '2',
      name: 'local',
      timestamp: 1472470996199000,
      duration: 207000,
      annotations: [],
      binaryAnnotations: [
        {key: 'lc', value: '', endpoint: {serviceName: 'frontend'}}
      ]
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.producer_remote
  it('converts incomplete producer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      kind: 'PRODUCER',
      timestamp: 1472470996199000,
      localEndpoint: frontend
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      timestamp: 1472470996199000,
      annotations: [
        {value: 'ms', timestamp: 1472470996199000, endpoint: frontend}
      ],
      binaryAnnotations: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.producer_duration
  it('converts producer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      kind: 'PRODUCER',
      localEndpoint: frontend,
      timestamp: 1472470996199000,
      duration: 51000
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      timestamp: 1472470996199000,
      duration: 51000,
      annotations: [
        {value: 'ms', timestamp: 1472470996199000, endpoint: frontend},
        {value: 'ws', timestamp: 1472470996250000, endpoint: frontend}
      ],
      binaryAnnotations: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.consumer
  it('converts incomplete consumer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'next-message',
      kind: 'CONSUMER',
      timestamp: 1472470996199000,
      localEndpoint: backend
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'next-message',
      timestamp: 1472470996199000,
      annotations: [
        {value: 'mr', timestamp: 1472470996199000, endpoint: backend}
      ],
      binaryAnnotations: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.consumer_remote
  it('converts incomplete consumer span with remote endpoint', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'next-message',
      kind: 'CONSUMER',
      timestamp: 1472470996199000,
      localEndpoint: backend,
      remoteEndpoint: {serviceName: 'kafka'}
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'next-message',
      timestamp: 1472470996199000,
      annotations: [
        {value: 'mr', timestamp: 1472470996199000, endpoint: backend}
      ],
      binaryAnnotations: [
        {key: 'ma', value: true, endpoint: {serviceName: 'kafka'}}
      ]
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  // originally zipkin2.v1.SpanConverterTest.consumer_duration
  it('converts consumer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      kind: 'CONSUMER',
      localEndpoint: backend,
      timestamp: 1472470996199000,
      duration: 51000
    };

    const v1 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      timestamp: 1472470996199000,
      duration: 51000,
      annotations: [
        {value: 'wr', timestamp: 1472470996199000, endpoint: backend},
        {value: 'mr', timestamp: 1472470996250000, endpoint: backend}
      ],
      binaryAnnotations: []
    };

    const expected = SPAN_V1.convert(v2);
    expect(v1).to.deep.equal(expected);
  });

  it('should retain ipv4 and ipv6 addresses', () => {
    const localEndpoint = {
      serviceName: 'there',
      ipv4: '10.57.50.84',
      ipv6: '2001:db8::c001',
      port: 80
    };

    const v2 = {
      traceId: '1',
      id: '2',
      localEndpoint
    };

    const v1 = SPAN_V1.convert(v2);
    expect(v1.binaryAnnotations.map(s => s.endpoint)).to.deep.equal([localEndpoint]);
  });

  it('should backfill empty endpoint serviceName', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      kind: 'CLIENT',
      timestamp: 1,
      localEndpoint: {
        ipv6: '2001:db8::c001'
      }
    };

    const v1 = SPAN_V1.convert(v2);
    expect(v1.annotations.map(s => s.endpoint)).to.deep.equal([{
      serviceName: '',
      ipv6: '2001:db8::c001'
    }]);
  });
});

describe('SPAN v1 Merge', () => {
  const clientSpan = {
    traceId: '1',
    parentId: '2',
    id: '3',
    name: 'get',
    timestamp: 1472470996199000,
    duration: 207000,
    annotations: [
      {value: 'cs', timestamp: 1472470996199000, endpoint: frontend},
      {value: 'cr', timestamp: 1472470996406000, endpoint: frontend}
    ],
    binaryAnnotations: []
  };
  const serverSpan = {
    traceId: '1',
    parentId: '2',
    id: '3',
    name: 'get',
    annotations: [
      {value: 'sr', timestamp: 1472470996238000, endpoint: backend},
      {value: 'ss', timestamp: 1472470996403000, endpoint: backend},
    ],
    binaryAnnotations: []
  };
  const mergedSpan = {
    traceId: '1',
    parentId: '2',
    id: '3',
    name: 'get',
    timestamp: 1472470996199000,
    duration: 207000,
    annotations: [
      {value: 'cs', timestamp: 1472470996199000, endpoint: frontend},
      {value: 'sr', timestamp: 1472470996238000, endpoint: backend},
      {value: 'ss', timestamp: 1472470996403000, endpoint: backend},
      {value: 'cr', timestamp: 1472470996406000, endpoint: frontend}
    ],
    binaryAnnotations: []
  };

  it('should merge server and client span', () => {
    const merged = SPAN_V1.merge(serverSpan, clientSpan);

    expect(merged).to.deep.equal(mergedSpan);
  });

  it('should merge client and server span', () => {
    const merged = SPAN_V1.merge(clientSpan, serverSpan);

    expect(merged).to.deep.equal(mergedSpan);
  });

  // originally zipkin2.v1.SpanConverterTest.mergeWhenBinaryAnnotationsSentSeparately
  it('should add late server addr', () => {
    const merged = SPAN_V1.merge(clientSpan, {
      traceId: '1',
      id: '3',
      binaryAnnotations: [{key: 'sa', value: true, endpoint: backend}]
    });

    expect(merged.binaryAnnotations).to.deep.equal([{key: 'sa', value: true, endpoint: backend}]);
  });

  // originally zipkin2.v1.SpanConverterTest.mergePrefersServerSpanName
  it('should overwrite client name with server name', () => {
    const merged = SPAN_V1.merge(clientSpan, {
      traceId: '1',
      id: '3',
      name: 'get /users/:userId',
      annotations: [{value: 'sr', timestamp: 1472470996238000, endpoint: backend}],
      binaryAnnotations: []
    });

    expect(merged.name).to.equal('get /users/:userId');
  });

  // originally zipkin2.v1.SpanConverterTest.timestampAndDurationMergeWithClockSkew
  it('should merge timestamp and duration even with skew', () => {
    const leftTimestamp = 100 * 1000;
    const leftDuration = 35 * 1000;

    const rightTimestamp = 200 * 1000;
    const rightDuration = 30 * 1000;

    const leftSpan = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: leftTimestamp,
      duration: leftDuration,
      annotations: [
        {value: 'cs', timestamp: leftTimestamp, endpoint: frontend},
        {value: 'cr', timestamp: leftTimestamp + leftDuration, endpoint: frontend}
      ],
      binaryAnnotations: []
    };

    const rightSpan = {
      traceId: '1',
      id: '3',
      name: 'get',
      timestamp: rightTimestamp,
      duration: rightDuration,
      annotations: [
        {value: 'sr', timestamp: rightTimestamp, endpoint: backend},
        {value: 'ss', timestamp: rightTimestamp + rightDuration, endpoint: backend},
      ],
      binaryAnnotations: []
    };

    const leftFirst = SPAN_V1.merge(leftSpan, rightSpan);
    const rightFirst = SPAN_V1.merge(rightSpan, leftSpan);

    [leftFirst, rightFirst].forEach((completeSpan) => {
      expect(completeSpan.timestamp).to.equal(leftTimestamp);
      expect(completeSpan.duration).to.equal(leftDuration);

      // ensure if server isn't propagated the parent ID, it is still ok.
      expect(completeSpan.parentId).to.equal(leftSpan.parentId);
    });
  });

  // originally zipkin2.v1.SpanConverterTest.mergeTraceIdHigh
  it('should prefer 128bit trace ID', () => {
    const left = {
      traceId: '463ac35c9f6413ad48485a3953bb6124',
      id: '3'
    };

    const right = {
      traceId: '48485a3953bb6124',
      id: '3'
    };

    const leftFirst = SPAN_V1.merge(left, right);
    const rightFirst = SPAN_V1.merge(right, left);

    [leftFirst, rightFirst].forEach((completeSpan) => {
      expect(completeSpan.traceId).to.equal(left.traceId);
    });
  });

  it('should not overwrite client name with empty', () => {
    const merged = SPAN_V1.merge(clientSpan, {
      traceId: '1',
      id: '3',
      name: '',
      annotations: [{value: 'sr', timestamp: 1472470996238000, endpoint: backend}],
      binaryAnnotations: []
    });

    expect(merged.name).to.equal(clientSpan.name);
  });

  it('should not overwrite client name with unknown', () => {
    const merged = SPAN_V1.merge(clientSpan, {
      traceId: '1',
      id: '3',
      name: 'unknown',
      annotations: [{value: 'sr', timestamp: 1472470996238000, endpoint: backend}],
      binaryAnnotations: []
    });

    expect(merged.name).to.equal(clientSpan.name);
  });
});
