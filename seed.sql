USE itosm_production;

INSERT INTO users (username, employee_id, is_admin, password)
VALUES ('admin','ADMIN001',1,'AdminPass123!')
ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id), is_admin=VALUES(is_admin), password=VALUES(password);

INSERT INTO users (username, employee_id, is_admin, password)
VALUES ('john.smith','EMP001',0,NULL)
ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id), is_admin=VALUES(is_admin);

INSERT INTO software_catalog (name, version) VALUES ('Microsoft Office 365','2024')
ON DUPLICATE KEY UPDATE version=VALUES(version);
INSERT INTO software_catalog (name, version) VALUES ('Google Chrome','Latest')
ON DUPLICATE KEY UPDATE version=VALUES(version);
INSERT INTO software_catalog (name, version) VALUES ('Slack','4.34.0')
ON DUPLICATE KEY UPDATE version=VALUES(version);

INSERT INTO tickets (ticket_id, user_id, request_type, software_id, description, status)
VALUES ('TIC-001',
        (SELECT id FROM users WHERE username='john.smith' LIMIT 1),
        'Installation',
        (SELECT id FROM software_catalog WHERE name='Google Chrome' LIMIT 1),
        'Install Chrome for john.smith',
        'Start')
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), request_type=VALUES(request_type),
  software_id=VALUES(software_id), description=VALUES(description), status=VALUES(status);

INSERT INTO ticket_history (ticket_id, status, notes)
SELECT t.id, 'Start', 'Ticket created'
FROM tickets t
WHERE t.ticket_id='TIC-001'
  AND NOT EXISTS (SELECT 1 FROM ticket_history th WHERE th.ticket_id=t.id AND th.status='Start');
